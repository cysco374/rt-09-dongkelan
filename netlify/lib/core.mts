import {
  createHmac,
  randomBytes,
  scryptSync,
  createHash,
  timingSafeEqual,
} from "node:crypto";

/** Minimal store surface (satisfied by @netlify/blobs and by the test double). */
export interface Store {
  get(key: string, opts?: { type: "json" }): Promise<any>;
  setJSON(key: string, value: unknown, opts?: { onlyIfNew?: boolean }): Promise<any>;
  delete(key: string): Promise<void>;
  list(opts: { prefix: string }): Promise<{ blobs: { key: string }[] }>;
}

export interface Env {
  adminUsername?: string;
  adminPassword?: string;
}

type Json = Record<string, any>;

const COLLECTIONS = [
  "warga",
  "kk",
  "pengumuman",
  "iuran",
  "surat",
  "fasilitas",
  "pengurus",
] as const;
type Collection = (typeof COLLECTIONS)[number];

const NIK_RE = /^\d{16}$/;
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const STATS_TTL_MS = 60 * 1000;
const BIGINT_KEYS = new Set(["createdAt", "month", "year", "total"]);

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---------- (de)serialization: bigint <-> {"__bi": "123"} ----------
export function decodeInput(raw: string): any {
  return JSON.parse(raw, (_k, v) =>
    v && typeof v === "object" && "__bi" in v ? Number(v.__bi) : v,
  );
}
function encodeOutput(value: any, key = ""): any {
  if (Array.isArray(value)) return value.map((v) => encodeOutput(v, key));
  if (value && typeof value === "object") {
    const out: Json = {};
    for (const [k, v] of Object.entries(value)) out[k] = encodeOutput(v, k);
    return out;
  }
  if (typeof value === "number" && BIGINT_KEYS.has(key))
    return { __bi: String(Math.trunc(value)) };
  return value;
}
const STAT_KEYS = [
  "totalWarga",
  "totalKK",
  "totalActivePengumuman",
  "totalWaitingSurat",
  "totalPaidIuranThisMonth",
];
function encodeStats(s: Json) {
  const out: Json = {};
  for (const k of STAT_KEYS) out[k] = { __bi: String(s[k] ?? 0) };
  return out;
}

// ---------- crypto helpers ----------
const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");
const safeEq = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};
const scryptHex = (secret: string, salt: string) =>
  scryptSync(secret, salt, 32).toString("hex");

async function getSecret(store: Store): Promise<string> {
  let rec = await store.get("meta/secret", { type: "json" });
  if (!rec) {
    await store.setJSON(
      "meta/secret",
      { v: randomBytes(32).toString("hex") },
      { onlyIfNew: true },
    );
    rec = await store.get("meta/secret", { type: "json" });
  }
  return rec.v as string;
}
async function signToken(store: Store, username: string): Promise<string> {
  const body = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + TOKEN_TTL_MS }),
  ).toString("base64url");
  const sig = createHmac("sha256", await getSecret(store))
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}
async function verifyToken(store: Store, token: string): Promise<boolean> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expect = createHmac("sha256", await getSecret(store))
    .update(body)
    .digest("base64url");
  if (!safeEq(sig, expect)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

// ---------- admin credentials ----------
async function getAdmin(store: Store, env: Env) {
  let rec = await store.get("meta/admin", { type: "json" });
  if (!rec && env.adminPassword) {
    const salt = randomBytes(16).toString("hex");
    rec = {
      username: env.adminUsername || "admin",
      salt,
      hash: scryptHex(sha256Hex(env.adminPassword), salt),
    };
    await store.setJSON("meta/admin", rec, { onlyIfNew: true });
    rec = await store.get("meta/admin", { type: "json" });
  }
  return rec as { username: string; salt: string; hash: string } | null;
}
async function checkCredentials(
  store: Store,
  env: Env,
  username: string,
  passwordHash: string,
) {
  const admin = await getAdmin(store, env);
  if (!admin) return false;
  const okUser = safeEq(String(username), admin.username);
  const okPass = safeEq(scryptHex(String(passwordHash), admin.salt), admin.hash);
  return okUser && okPass;
}

// ---------- collections ----------
async function listAll(store: Store, c: Collection): Promise<Json[]> {
  const { blobs } = await store.list({ prefix: `${c}/` });
  const out: Json[] = [];
  for (let i = 0; i < blobs.length; i += 25) {
    const chunk = await Promise.all(
      blobs.slice(i, i + 25).map((b) => store.get(b.key, { type: "json" })),
    );
    for (const item of chunk) if (item) out.push(item);
  }
  return out.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}
const newId = (c: string) =>
  `${c}_${Date.now()}_${randomBytes(3).toString("hex")}`;

const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max);

async function computeStats(store: Store) {
  const [w, k, p, s, i] = await Promise.all([
    store.list({ prefix: "warga/" }),
    store.list({ prefix: "kk/" }),
    listAll(store, "pengumuman"),
    listAll(store, "surat"),
    listAll(store, "iuran"),
  ]);
  const now = new Date(Date.now() + 7 * 3600 * 1000); // WIB
  const m = now.getUTCMonth() + 1;
  const y = now.getUTCFullYear();
  return {
    totalWarga: w.blobs.length,
    totalKK: k.blobs.length,
    totalActivePengumuman: p.filter((x) => x.status === "active").length,
    totalWaitingSurat: s.filter((x) => x.status === "waiting").length,
    totalPaidIuranThisMonth: i.filter(
      (x) => x.status === "paid" && Number(x.month) === m && Number(x.year) === y,
    ).length,
  };
}

// ---------- method table ----------
type Ctx = { store: Store; env: Env; authed: boolean };
type Method = { auth: boolean; fn: (c: Ctx, args: any[]) => Promise<any> };
const methods: Record<string, Method> = {};

for (const c of COLLECTIONS) {
  const Cap = c === "kk" ? "KK" : c[0].toUpperCase() + c.slice(1);
  const pub = c === "pengurus";
  methods[`add${Cap}`] = {
    auth: true,
    fn: async ({ store }, [data]) => {
      const id = newId(c);
      await store.setJSON(`${c}/${id}`, { ...data, id, createdAt: Date.now() });
      return id;
    },
  };
  methods[`get${Cap}`] = {
    auth: true,
    fn: async ({ store }, [id]) =>
      (await store.get(`${c}/${str(id, 100)}`, { type: "json" })) ?? null,
  };
  methods[`list${Cap}`] = {
    auth: !pub,
    fn: async ({ store }) => listAll(store, c),
  };
  methods[`update${Cap}`] = {
    auth: true,
    fn: async ({ store }, [data]) => {
      const key = `${c}/${str(data?.id, 100)}`;
      const old = await store.get(key, { type: "json" });
      if (!old) throw new HttpError(404, "Data tidak ditemukan");
      await store.setJSON(key, { ...data, id: old.id, createdAt: old.createdAt });
    },
  };
  methods[`delete${Cap}`] = {
    auth: true,
    fn: async ({ store }, [id]) => {
      const key = `${c}/${str(id, 100)}`;
      if (!(await store.get(key, { type: "json" })))
        throw new HttpError(404, "Data tidak ditemukan");
      await store.delete(key);
    },
  };
}

const filterBy = (c: Collection, field: string) => async (
  { store }: Ctx,
  [v]: any[],
) => (await listAll(store, c)).filter((x) => x[field] === v);

methods.filterWargaByStatus = { auth: true, fn: filterBy("warga", "status") };
methods.filterWargaByKK = { auth: true, fn: filterBy("warga", "kkNumber") };
methods.filterIuranByWarga = { auth: true, fn: filterBy("iuran", "wargaId") };
methods.filterIuranByStatus = { auth: true, fn: filterBy("iuran", "status") };
methods.filterSuratByWarga = { auth: true, fn: filterBy("surat", "wargaId") };
methods.filterSuratByStatus = { auth: true, fn: filterBy("surat", "status") };
methods.filterIuranByMonthYear = {
  auth: true,
  fn: async ({ store }, [m, y]) =>
    (await listAll(store, "iuran")).filter(
      (x) => Number(x.month) === Number(m) && Number(x.year) === Number(y),
    ),
};
methods.listActivePengumuman = {
  auth: false,
  fn: async ({ store }) =>
    (await listAll(store, "pengumuman"))
      .filter((x) => x.status === "active")
      .sort((a, b) => String(b.date).localeCompare(String(a.date))),
};

methods.getWebsiteSettings = {
  auth: false,
  fn: async ({ store }) =>
    (await store.get("meta/settings", { type: "json" })) ?? null,
};
methods.setWebsiteSettings = {
  auth: true,
  fn: async ({ store }, [s]) => {
    await store.setJSON("meta/settings", s);
  },
};

methods.getStatistics = {
  auth: false,
  fn: async ({ store, authed }) => {
    if (!authed) {
      const cached = await store.get("meta/stats", { type: "json" });
      if (cached && Date.now() - cached.at < STATS_TTL_MS) return cached.stats;
    }
    const stats = await computeStats(store);
    await store.setJSON("meta/stats", { at: Date.now(), stats });
    return stats;
  },
};

// admin account
methods.getAdminUsername = {
  auth: true,
  fn: async ({ store, env }) => (await getAdmin(store, env))?.username ?? "",
};
methods.setAdminCredentials = {
  auth: true,
  fn: async ({ store, env }, [username, passwordHash, currentPasswordHash]) => {
    const admin = await getAdmin(store, env);
    if (!admin) return false;
    if (!(await checkCredentials(store, env, admin.username, currentPasswordHash)))
      return false;
    const u = str(username, 60).trim();
    if (!u || !/^[a-f0-9]{64}$/.test(String(passwordHash))) return false;
    const salt = randomBytes(16).toString("hex");
    await store.setJSON("meta/admin", {
      username: u,
      salt,
      hash: scryptHex(String(passwordHash), salt),
    });
    return true;
  },
};

// ---------- public portal (NIK based) ----------
async function findWargaByNik(store: Store, nik: unknown) {
  const n = String(nik ?? "");
  if (!NIK_RE.test(n)) throw new HttpError(400, "NIK harus 16 digit angka");
  return (await listAll(store, "warga")).find((w) => w.nik === n) ?? null;
}
methods.portalLookup = {
  auth: false,
  fn: async ({ store }, [nik]) => {
    const w = await findWargaByNik(store, nik);
    if (!w) return null;
    const [iuran, surat] = await Promise.all([
      listAll(store, "iuran"),
      listAll(store, "surat"),
    ]);
    return {
      warga: {
        id: w.id,
        fullName: w.fullName,
        address: w.address,
        kkNumber: w.kkNumber,
      },
      iuran: iuran.filter((x) => x.wargaId === w.id),
      surat: surat.filter((x) => x.wargaId === w.id),
    };
  },
};
methods.portalSubmitSurat = {
  auth: false,
  fn: async ({ store }, [nik, suratType, purpose]) => {
    const w = await findWargaByNik(store, nik);
    if (!w) throw new HttpError(404, "NIK tidak ditemukan");
    if (!["domicile", "poor", "ktp", "kk", "other"].includes(suratType))
      throw new HttpError(400, "Jenis surat tidak valid");
    const p = str(purpose, 500).trim();
    if (!p) throw new HttpError(400, "Keperluan wajib diisi");
    const existing = (await listAll(store, "surat")).filter(
      (s) => s.wargaId === w.id && s.status === "waiting",
    );
    if (existing.length >= 5)
      throw new HttpError(429, "Terlalu banyak pengajuan yang masih menunggu");
    const id = newId("surat");
    await store.setJSON(`surat/${id}`, {
      id,
      wargaId: w.id,
      applicant: w.fullName,
      suratType,
      purpose: p,
      status: "waiting",
      requestDate: new Date(Date.now() + 7 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      createdAt: Date.now(),
    });
    return id;
  },
};

methods.login = {
  auth: false,
  fn: async ({ store, env }, [username, passwordHash]) => {
    if (!(await checkCredentials(store, env, username, passwordHash)))
      throw new HttpError(401, "Username atau password salah");
    const admin = await getAdmin(store, env);
    return signToken(store, admin!.username);
  },
};

// ---------- entry ----------
export async function handleRpc(
  req: Request,
  store: Store,
  env: Env,
): Promise<Response> {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  try {
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
    const raw = await req.text();
    if (raw.length > 1_000_000) throw new HttpError(413, "Payload terlalu besar");
    const { method, args } = decodeInput(raw) as { method: string; args?: any[] };
    const m = Object.hasOwn(methods, method) ? methods[method] : undefined;
    if (!m) throw new HttpError(404, "Method tidak dikenal");

    const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
    const authed = bearer ? await verifyToken(store, bearer) : false;
    if (m.auth && !authed) throw new HttpError(401, "Sesi berakhir, silakan login ulang");

    const result = await m.fn({ store, env, authed }, Array.isArray(args) ? args : []);
    const body =
      method === "getStatistics" ? encodeStats(result) : encodeOutput(result);
    return json({ result: body === undefined ? null : body });
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Terjadi kesalahan pada server" }, 500);
  }
}
