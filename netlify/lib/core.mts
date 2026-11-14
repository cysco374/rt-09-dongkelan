import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/** Minimal store surface (satisfied by @netlify/blobs and by the test double). */
export interface Store {
  get(key: string, opts?: { type: "json" }): Promise<any>;
  setJSON(
    key: string,
    value: unknown,
    opts?: { onlyIfNew?: boolean },
  ): Promise<any>;
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
  const okPass = safeEq(
    scryptHex(String(passwordHash), admin.salt),
    admin.hash,
  );
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
      (x) =>
        x.status === "paid" && Number(x.month) === m && Number(x.year) === y,
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
      await store.setJSON(key, {
        ...data,
        id: old.id,
        createdAt: old.createdAt,
      });
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

const filterBy =
  (c: Collection, field: string) =>
  async ({ store }: Ctx, [v]: any[]) =>
    (await listAll(store, c)).filter((x) => x[field] === v);

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
    if (
      !(await checkCredentials(store, env, admin.username, currentPasswordHash))
    )
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

// ---------- public portal (Nomor KK atau NIK) ----------
const KEY_RE = /^\d{10,20}$/;
async function resolveKk(store: Store, key: unknown) {
  const k = String(key ?? "").trim();
  if (!KEY_RE.test(k))
    throw new HttpError(
      400,
      "Nomor KK atau NIK harus berupa angka (10–20 digit)",
    );
  const [kks, warga] = await Promise.all([
    listAll(store, "kk"),
    listAll(store, "warga"),
  ]);
  let kk = kks.find((x) => x.number === k);
  let members: Json[];
  if (kk) {
    members = warga.filter((w) => w.kkNumber === kk!.number);
  } else {
    const w = warga.find((x) => x.nik === k);
    if (!w) return null;
    members = w.kkNumber ? warga.filter((x) => x.kkNumber === w.kkNumber) : [w];
    kk = kks.find((x) => x.number === w.kkNumber) ?? {
      number: w.kkNumber || "-",
      head: w.fullName,
      address: w.address,
    };
  }
  return { kk: kk!, members };
}
methods.portalLookup = {
  auth: false,
  fn: async ({ store }, [key]) => {
    const r = await resolveKk(store, key);
    if (!r) return null;
    const ids = new Set(r.members.map((m) => m.id));
    const [iuran, surat] = await Promise.all([
      listAll(store, "iuran"),
      listAll(store, "surat"),
    ]);
    return {
      kk: { number: r.kk.number, head: r.kk.head, address: r.kk.address },
      members: r.members.map((m) => ({ id: m.id, fullName: m.fullName })),
      iuran: iuran.filter((x) => ids.has(x.wargaId)),
      surat: surat.filter((x) => ids.has(x.wargaId)),
    };
  },
};
methods.portalSubmitSurat = {
  auth: false,
  fn: async ({ store }, [key, wargaId, suratType, purpose]) => {
    const r = await resolveKk(store, key);
    if (!r) throw new HttpError(404, "Nomor KK/NIK tidak ditemukan");
    const w = r.members.find((m) => m.id === wargaId);
    if (!w) throw new HttpError(400, "Pemohon bukan anggota KK ini");
    if (!["domicile", "poor", "ktp", "kk", "other"].includes(suratType))
      throw new HttpError(400, "Jenis surat tidak valid");
    const p = str(purpose, 500).trim();
    if (!p) throw new HttpError(400, "Keperluan wajib diisi");
    const ids = new Set(r.members.map((m) => m.id));
    const waiting = (await listAll(store, "surat")).filter(
      (s) => ids.has(s.wargaId) && s.status === "waiting",
    );
    if (waiting.length >= 5)
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

// ---------- demo data (admin only, only when empty) ----------
const DEMO_KK: {
  no: string;
  head: string;
  address: string;
  members: [string, string, string, string, string][];
}[] = [
  {
    no: "3402010101260001",
    head: "Slamet Riyadi",
    address: "Jl. Dongkelan No. 12, RT 09",
    members: [
      ["Slamet Riyadi", "male", "1978-03-14", "Wiraswasta", "kawin"],
      ["Sri Wahyuni", "female", "1981-07-22", "Ibu Rumah Tangga", "kawin"],
      ["Bagas Riyadi", "male", "2004-11-02", "Mahasiswa", "belum kawin"],
      ["Ayu Riyadi", "female", "2009-05-19", "Pelajar", "belum kawin"],
    ],
  },
  {
    no: "3402010101260002",
    head: "Agus Setiawan",
    address: "Jl. Dongkelan No. 14, RT 09",
    members: [
      ["Agus Setiawan", "male", "1985-01-09", "Guru", "kawin"],
      ["Dewi Lestari", "female", "1987-09-30", "Perawat", "kawin"],
      ["Raka Setiawan", "male", "2013-04-11", "Pelajar", "belum kawin"],
    ],
  },
  {
    no: "3402010101260003",
    head: "Suparman",
    address: "Jl. Dongkelan No. 21, RT 09",
    members: [
      ["Suparman", "male", "1960-12-05", "Pensiunan", "kawin"],
      ["Sumiyati", "female", "1963-02-17", "Ibu Rumah Tangga", "kawin"],
    ],
  },
  {
    no: "3402010101260004",
    head: "Nur Hidayat",
    address: "Gang Melati No. 3, RT 09",
    members: [
      ["Nur Hidayat", "male", "1990-06-25", "Karyawan Swasta", "kawin"],
      ["Fitri Handayani", "female", "1992-10-08", "Pedagang", "kawin"],
      ["Alya Hidayat", "female", "2018-08-14", "Pelajar", "belum kawin"],
      ["Fajar Hidayat", "male", "2021-01-27", "Belum Bekerja", "belum kawin"],
    ],
  },
  {
    no: "3402010101260005",
    head: "Widodo Prasetyo",
    address: "Gang Melati No. 7, RT 09",
    members: [
      ["Widodo Prasetyo", "male", "1972-04-03", "Sopir", "kawin"],
      ["Endang Purwanti", "female", "1975-11-21", "Penjahit", "kawin"],
      [
        "Dimas Prasetyo",
        "male",
        "2000-09-12",
        "Karyawan Swasta",
        "belum kawin",
      ],
    ],
  },
  {
    no: "3402010101260006",
    head: "Rina Marlina",
    address: "Jl. Dongkelan No. 30, RT 09",
    members: [
      ["Rina Marlina", "female", "1988-02-28", "Apoteker", "cerai hidup"],
      ["Kevin Marlina", "male", "2012-12-01", "Pelajar", "belum kawin"],
    ],
  },
];
const DEMO_FASILITAS = [
  {
    name: "Balai Pertemuan RT 09",
    fasilitasType: "building",
    condition: "good",
    acquisitionYear: 2012,
    location: "Jl. Dongkelan, depan lapangan",
    description:
      "Tempat rapat warga, arisan, dan kegiatan kampung. Kapasitas ±60 orang.",
  },
  {
    name: "Pos Ronda",
    fasilitasType: "building",
    condition: "lightDamage",
    acquisitionYear: 2015,
    location: "Perempatan Gang Melati",
    description:
      "Pos jaga ronda malam. Atap bocor di sisi timur, perlu diperbaiki.",
  },
  {
    name: "Tenda Pesta 4x6 m (2 unit)",
    fasilitasType: "equipment",
    condition: "good",
    acquisitionYear: 2019,
    location: "Gudang Balai RT",
    description: "Dapat dipinjam warga untuk hajatan. Pinjam melalui pengurus.",
  },
  {
    name: "Kursi Plastik (100 buah)",
    fasilitasType: "equipment",
    condition: "good",
    acquisitionYear: 2018,
    location: "Gudang Balai RT",
    description: "Inventaris kursi untuk kegiatan RT dan peminjaman warga.",
  },
  {
    name: "Sound System Portable",
    fasilitasType: "equipment",
    condition: "lightDamage",
    acquisitionYear: 2020,
    location: "Rumah Ketua RT",
    description: "Speaker dan mixer untuk acara. Salah satu mic perlu diganti.",
  },
  {
    name: "Motor Roda Tiga Pengangkut Sampah",
    fasilitasType: "vehicle",
    condition: "good",
    acquisitionYear: 2021,
    location: "Garasi Balai RT",
    description: "Pengangkut sampah keliling kampung, jadwal Selasa dan Sabtu.",
  },
  {
    name: "Tandon Air & Hidran Lingkungan",
    fasilitasType: "other",
    condition: "heavyDamage",
    acquisitionYear: 2010,
    location: "Ujung Gang Melati",
    description:
      "Cadangan air untuk pemadaman kebakaran. Pompa rusak, perlu penggantian.",
  },
  {
    name: "Taman & Lapangan Bulu Tangkis",
    fasilitasType: "other",
    condition: "good",
    acquisitionYear: 2016,
    location: "Depan Balai RT",
    description: "Fasilitas olahraga dan ruang bermain anak.",
  },
];

methods.seedDemo = {
  auth: true,
  fn: async ({ store }) => {
    const exist = await Promise.all(
      (["warga", "kk", "iuran", "fasilitas"] as const).map((c) =>
        store.list({ prefix: `${c}/` }),
      ),
    );
    if (exist.some((e) => e.blobs.length > 0))
      throw new HttpError(
        409,
        "Data sudah ada. Data contoh hanya bisa diisi saat data masih kosong.",
      );

    const writes: Promise<unknown>[] = [];
    const put = (c: string, obj: Json) => {
      const id = newId(c);
      writes.push(
        store.setJSON(`${c}/${id}`, { ...obj, id, createdAt: Date.now() }),
      );
      return id;
    };
    const heads: { id: string; name: string }[] = [];
    let seq = 1;
    for (const kk of DEMO_KK) {
      put("kk", {
        number: kk.no,
        head: kk.head,
        address: kk.address,
        members: kk.members.map((m) => m[0]),
      });
      for (const [name, gender, dob, job, marital] of kk.members) {
        const id = put("warga", {
          nik: `340201${String(seq++).padStart(10, "0")}`,
          fullName: name,
          dob,
          gender,
          address: kk.address,
          phone: `0812${String(30000000 + seq * 7919).slice(0, 8)}`,
          status: "tetap",
          kkNumber: kk.no,
          maritalStatus: marital,
          job,
        });
        if (name === kk.head) heads.push({ id, name });
      }
    }

    // Iuran 3 bulan terakhir (WIB), dibayar per kepala keluarga
    const now = new Date(Date.now() + 7 * 3600 * 1000);
    const months: { m: number; y: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
      );
      months.push({ m: d.getUTCMonth() + 1, y: d.getUTCFullYear() });
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    heads.forEach((h, hi) => {
      months.forEach(({ m, y }, mi) => {
        const isCurrent = mi === months.length - 1;
        const kinds: [string, number][] = [["monthly", 25000]];
        if (isCurrent || mi === months.length - 2)
          kinds.push(["security", 20000], ["cleaning", 10000]);
        for (const [type, total] of kinds) {
          // bulan lalu lunas semua; bulan berjalan sebagian belum bayar
          const paid =
            !isCurrent || (hi + (type === "monthly" ? 0 : 1)) % 3 !== 0;
          put("iuran", {
            wargaId: h.id,
            wargaName: h.name,
            iuranType: type,
            month: m,
            year: y,
            total,
            status: paid ? "paid" : "unpaid",
            ...(paid
              ? {
                  paymentDate: `${y}-${pad(m)}-${pad(3 + ((hi * 2 + mi) % 18))}`,
                }
              : {}),
          });
        }
      });
    });

    for (const f of DEMO_FASILITAS) put("fasilitas", f);
    await Promise.all(writes);
    await store.delete("meta/stats");
    return {
      kk: DEMO_KK.length,
      warga: seq - 1,
      fasilitas: DEMO_FASILITAS.length,
    };
  },
};

const MORE_KK: typeof DEMO_KK = [
  {
    no: "3402010101260007",
    head: "Hendra Gunawan",
    address: "Jl. Dongkelan No. 35, RT 09",
    members: [
      ["Hendra Gunawan", "male", "1982-08-18", "Wiraswasta", "kawin"],
      ["Lina Marlina", "female", "1984-03-06", "Pedagang", "kawin"],
      ["Satria Gunawan", "male", "2008-10-23", "Pelajar", "belum kawin"],
      ["Nabila Gunawan", "female", "2015-06-30", "Pelajar", "belum kawin"],
    ],
  },
  {
    no: "3402010101260008",
    head: "Yoga Pratama",
    address: "Gang Melati No. 11, RT 09",
    members: [
      ["Yoga Pratama", "male", "1994-05-12", "Karyawan Swasta", "kawin"],
      ["Citra Anjani", "female", "1996-12-29", "Desainer", "kawin"],
      ["Zahra Pratama", "female", "2023-02-14", "Belum Bekerja", "belum kawin"],
    ],
  },
];
const MORE_KOS = [
  ["Rizky Ramadhan", "male", "2003-07-09", "Mahasiswa"],
  ["Ahmad Fauzi", "male", "2002-11-26", "Mahasiswa"],
  ["Putri Anggraini", "female", "2004-01-15", "Mahasiswa"],
];
const MORE_FASILITAS = [
  {
    name: "Genset 2.200 Watt",
    fasilitasType: "equipment",
    condition: "good",
    acquisitionYear: 2022,
    location: "Gudang Balai RT",
    description:
      "Cadangan listrik untuk kegiatan malam dan saat listrik padam.",
  },
  {
    name: "Papan Informasi Warga",
    fasilitasType: "other",
    condition: "lightDamage",
    acquisitionYear: 2017,
    location: "Depan Balai RT",
    description: "Papan pengumuman fisik. Kaca pelindung retak.",
  },
  {
    name: "Peralatan Kerja Bakti",
    fasilitasType: "equipment",
    condition: "good",
    acquisitionYear: 2020,
    location: "Gudang Balai RT",
    description:
      "Cangkul, sapu lidi, sekop, dan gerobak dorong untuk kerja bakti rutin.",
  },
  {
    name: "Gerobak Sampah Cadangan (3 unit)",
    fasilitasType: "vehicle",
    condition: "heavyDamage",
    acquisitionYear: 2014,
    location: "Garasi Balai RT",
    description: "Roda dan bak berkarat, perlu peremajaan.",
  },
];

methods.seedDemoMore = {
  auth: true,
  fn: async ({ store }) => {
    const [kks, wargas, iurans, fass] = await Promise.all([
      listAll(store, "kk"),
      listAll(store, "warga"),
      listAll(store, "iuran"),
      listAll(store, "fasilitas"),
    ]);
    const writes: Promise<unknown>[] = [];
    const put = (c: string, obj: Json) => {
      const id = newId(c);
      writes.push(
        store.setJSON(`${c}/${id}`, { ...obj, id, createdAt: Date.now() }),
      );
      return id;
    };
    const counts = { kk: 0, warga: 0, iuran: 0, fasilitas: 0 };

    // KK + warga tambahan (lewati nomor KK yang sudah ada)
    let seq =
      wargas.reduce((m, w) => {
        const n = /^340201\d{10}$/.test(w.nik) ? Number(w.nik.slice(6)) : 0;
        return Math.max(m, n);
      }, 0) + 1;
    const nextNik = () => `340201${String(seq++).padStart(10, "0")}`;
    const phone = () => `0813${String(40000000 + seq * 6151).slice(0, 8)}`;
    const heads: { id: string; name: string }[] = wargas
      .filter((w) =>
        kks.some((k) => k.number === w.kkNumber && k.head === w.fullName),
      )
      .map((w) => ({ id: w.id, name: w.fullName }));
    for (const kk of MORE_KK) {
      if (kks.some((k) => k.number === kk.no)) continue;
      put("kk", {
        number: kk.no,
        head: kk.head,
        address: kk.address,
        members: kk.members.map((m) => m[0]),
      });
      counts.kk++;
      for (const [name, gender, dob, job, marital] of kk.members) {
        const id = put("warga", {
          nik: nextNik(),
          fullName: name,
          dob,
          gender,
          address: kk.address,
          phone: phone(),
          status: kk.no.endsWith("8") ? "kontrak" : "tetap",
          kkNumber: kk.no,
          maritalStatus: marital,
          job,
        });
        counts.warga++;
        if (name === kk.head) heads.push({ id, name });
      }
    }
    if (!wargas.some((w) => w.status === "kos")) {
      for (const [name, gender, dob, job] of MORE_KOS) {
        put("warga", {
          nik: nextNik(),
          fullName: name,
          dob,
          gender,
          address: "Kos Putra-Putri Bu Narti, Gang Melati RT 09",
          phone: phone(),
          status: "kos",
          kkNumber: "",
          maritalStatus: "belum kawin",
          job,
        });
        counts.warga++;
      }
    }

    // Riwayat iuran: Januari tahun berjalan s.d. bulan berjalan, per kepala keluarga
    const now = new Date(Date.now() + 7 * 3600 * 1000);
    const y = now.getUTCFullYear();
    const cm = now.getUTCMonth() + 1;
    const have = new Set(
      iurans.map((i) => `${i.wargaId}|${i.iuranType}|${i.year}|${i.month}`),
    );
    const pad = (n: number) => String(n).padStart(2, "0");
    heads.forEach((h, hi) => {
      for (let m = 1; m <= cm; m++) {
        const kinds: [string, number][] = [["monthly", 25000]];
        if (m % 3 === 0 || m === cm) kinds.push(["security", 20000]);
        if (m % 2 === 0) kinds.push(["cleaning", 10000]);
        if (m === 8) kinds.push(["social", 50000]); // iuran sosial 17 Agustus
        for (const [type, total] of kinds) {
          if (have.has(`${h.id}|${type}|${y}|${m}`)) continue;
          const unpaid =
            m === cm
              ? (hi + m) % 3 === 0
              : m === cm - 1 && (hi * 5 + m) % 7 === 0;
          put("iuran", {
            wargaId: h.id,
            wargaName: h.name,
            iuranType: type,
            month: m,
            year: y,
            total,
            status: unpaid ? "unpaid" : "paid",
            ...(unpaid
              ? {}
              : {
                  paymentDate: `${y}-${pad(m)}-${pad(2 + ((hi * 3 + m) % 20))}`,
                }),
          });
          counts.iuran++;
        }
      }
    });

    for (const f of MORE_FASILITAS) {
      if (fass.some((x) => x.name === f.name)) continue;
      put("fasilitas", f);
      counts.fasilitas++;
    }
    await Promise.all(writes);
    await store.delete("meta/stats");
    return counts;
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
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  try {
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
    const raw = await req.text();
    if (raw.length > 1_000_000)
      throw new HttpError(413, "Payload terlalu besar");
    const { method, args } = decodeInput(raw) as {
      method: string;
      args?: any[];
    };
    const m = Object.hasOwn(methods, method) ? methods[method] : undefined;
    if (!m) throw new HttpError(404, "Method tidak dikenal");

    const bearer = (req.headers.get("authorization") ?? "").replace(
      /^Bearer /,
      "",
    );
    const authed = bearer ? await verifyToken(store, bearer) : false;
    if (m.auth && !authed)
      throw new HttpError(401, "Sesi berakhir, silakan login ulang");

    const result = await m.fn(
      { store, env, authed },
      Array.isArray(args) ? args : [],
    );
    const body =
      method === "getStatistics" ? encodeStats(result) : encodeOutput(result);
    return json({ result: body === undefined ? null : body });
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Terjadi kesalahan pada server" }, 500);
  }
}
