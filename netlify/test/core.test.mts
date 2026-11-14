import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { handleRpc } from "../lib/core.mts";

const mem = new Map<string, any>();
const store = {
  async get(k: string) {
    return mem.has(k) ? structuredClone(mem.get(k)) : null;
  },
  async setJSON(k: string, v: unknown, o?: { onlyIfNew?: boolean }) {
    if (o?.onlyIfNew && mem.has(k)) return { modified: false };
    mem.set(k, structuredClone(v));
    return { modified: true };
  },
  async delete(k: string) {
    mem.delete(k);
  },
  async list({ prefix }: { prefix: string }) {
    return {
      blobs: [...mem.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((key) => ({ key })),
    };
  },
};
const env = { adminUsername: "admin", adminPassword: "rahasia123" };
const h = (p: string) => createHash("sha256").update(p).digest("hex");
let token = "";
async function call(method: string, args: any[] = [], tok = token) {
  const body = JSON.stringify(args, (_k, v) =>
    typeof v === "bigint" ? { __bi: v.toString() } : v,
  );
  const res = await handleRpc(
    new Request("http://x/api/rpc", {
      method: "POST",
      headers: tok ? { authorization: `Bearer ${tok}` } : {},
      body: `{"method":"${method}","args":${body}}`,
    }),
    store as never,
    env,
  );
  return { status: res.status, ...(await res.json()) } as any;
}

// auth
assert.equal((await call("listWarga")).status, 401);
assert.equal((await call("login", ["admin", h("salah")])).status, 401);
assert.equal((await call("login", ["admin", h("rahasia123")])).status, 200);
token = (await call("login", ["admin", h("rahasia123")])).result;
assert.equal((await call("listWarga", [], "abc.def")).status, 401);

// crud
const w = {
  id: "",
  nik: "3404010101010001",
  fullName: "Budi Santoso",
  dob: "1990-01-01",
  gender: "male",
  address: "Jl. Mawar 1",
  phone: "08123",
  status: "tetap",
  kkNumber: "111",
  maritalStatus: "kawin",
  job: "Guru",
  createdAt: { __bi: "0" },
};
const added = await call("addWarga", [w]);
assert.equal(added.status, 200);
const list = await call("listWarga");
assert.equal(list.result.length, 1);
assert.ok(list.result[0].createdAt.__bi, "createdAt encoded as bigint");
const wid = added.result;
await call("updateWarga", [
  { ...list.result[0], job: "Dosen", createdAt: { __bi: "1" } },
]);
assert.equal((await call("getWarga", [wid])).result.job, "Dosen");
assert.equal((await call("updateWarga", [{ ...w, id: "nope" }])).status, 404);

// iuran + filters + stats
const now = new Date(Date.now() + 7 * 3600e3);
await call("addIuran", [
  {
    id: "",
    wargaId: wid,
    wargaName: "Budi",
    iuranType: "monthly",
    month: { __bi: String(now.getUTCMonth() + 1) },
    year: { __bi: String(now.getUTCFullYear()) },
    total: { __bi: "20000" },
    status: "paid",
    paymentDate: "2026-11-01",
    createdAt: { __bi: "0" },
  },
]);
assert.equal((await call("filterIuranByStatus", ["paid"])).result.length, 1);
assert.equal((await call("filterIuranByWarga", [wid])).result.length, 1);
const stats = await call("getStatistics", [], "");
assert.equal(stats.result.totalWarga.__bi, "1");
assert.equal(stats.result.totalPaidIuranThisMonth.__bi, "1");

// public portal (KK or NIK)
assert.equal((await call("portalLookup", ["123"], "")).status, 400);
assert.equal(
  (await call("portalLookup", ["3404010101010999"], "")).result,
  null,
);
await call("addKK", [
  {
    id: "",
    number: "111",
    head: "Budi Santoso",
    address: "Jl. Mawar 1",
    members: ["Budi Santoso"],
    createdAt: { __bi: "0" },
  },
]);
await call("addKK", [
  {
    id: "",
    number: "3404010101019999",
    head: "Budi Santoso",
    address: "Jl. Mawar 1",
    members: ["Budi Santoso"],
    createdAt: { __bi: "0" },
  },
]);
await call("updateWarga", [
  {
    ...(await call("getWarga", [wid])).result,
    kkNumber: "3404010101019999",
    createdAt: { __bi: "0" },
  },
]);
for (const key of ["3404010101010001", "3404010101019999"]) {
  const look = await call("portalLookup", [key], "");
  assert.equal(look.result.kk.number, "3404010101019999", "resolved by " + key);
  assert.equal(look.result.members[0].fullName, "Budi Santoso");
  assert.equal(look.result.members[0].nik, undefined, "NIK not echoed");
  assert.equal(look.result.iuran.length, 1);
}
const sub = await call(
  "portalSubmitSurat",
  ["3404010101019999", wid, "domicile", "Melamar kerja"],
  "",
);
assert.equal(sub.status, 200);
assert.equal(
  (
    await call(
      "portalSubmitSurat",
      ["3404010101019999", "orang_lain", "domicile", "x"],
      "",
    )
  ).status,
  400,
);
assert.equal(
  (await call("portalSubmitSurat", ["3404010101019999", wid, "hack", "x"], ""))
    .status,
  400,
);
assert.equal((await call("listSurat")).result[0].status, "waiting");
assert.equal(
  (await call("listWarga", [], "")).status,
  401,
  "listWarga stays private",
);

// pengumuman public
await call("addPengumuman", [
  {
    id: "",
    title: "A",
    content: "c",
    category: "general",
    date: "2026-11-01",
    status: "active",
    author: "RT",
    createdAt: { __bi: "0" },
  },
]);
assert.equal((await call("listActivePengumuman", [], "")).result.length, 1);

// credentials change
assert.equal(
  (await call("setAdminCredentials", ["admin", h("baru12345"), h("salah")]))
    .result,
  false,
);
assert.equal(
  (
    await call("setAdminCredentials", [
      "pengurus",
      h("baru12345"),
      h("rahasia123"),
    ])
  ).result,
  true,
);
assert.equal((await call("login", ["admin", h("rahasia123")], "")).status, 401);
assert.equal(
  (await call("login", ["pengurus", h("baru12345")], "")).status,
  200,
);

// delete
assert.equal((await call("deleteWarga", [wid])).status, 200);
assert.equal((await call("deleteWarga", [wid])).status, 404);
assert.equal((await call("nope", [], "")).status, 404);
// seed demo on empty store
mem.clear();
await call("login", ["admin", h("rahasia123")], "").then((r) => {
  token = r.result;
});
assert.equal((await call("seedDemo", [], "")).status, 401);
const seeded = await call("seedDemo");
assert.equal(seeded.status, 200, JSON.stringify(seeded));
const kks = (await call("listKK")).result;
const wargas = (await call("listWarga")).result;
const iur = (await call("listIuran")).result;
const fas = (await call("listFasilitas")).result;
assert.equal(kks.length, 6);
assert.equal(wargas.length, 18);
assert.ok(fas.length === 8 && iur.length > 30);
for (const k of kks) {
  const m = wargas
    .filter((w: any) => w.kkNumber === k.number)
    .map((w: any) => w.fullName)
    .sort();
  assert.deepEqual(m, [...k.members].sort(), "KK members match warga");
  assert.ok(m.includes(k.head));
}
assert.equal(new Set(wargas.map((w: any) => w.nik)).size, 18, "NIK unique");
assert.ok(wargas.every((w: any) => /^\d{16}$/.test(w.nik)));
assert.ok(iur.every((i: any) => wargas.some((w: any) => w.id === i.wargaId)));
assert.ok(
  iur.some((i: any) => i.status === "unpaid") &&
    iur.some((i: any) => i.status === "paid"),
);
assert.equal((await call("seedDemo")).status, 409, "no double seed");
// additional demo data
const more = await call("seedDemoMore");
assert.equal(more.status, 200, JSON.stringify(more));
assert.equal(more.result.kk, 2);
assert.equal(more.result.warga, 10);
assert.ok(more.result.iuran > 20 && more.result.fasilitas === 4);
const more2 = await call("seedDemoMore");
assert.deepEqual(
  more2.result,
  { kk: 0, warga: 0, iuran: 0, fasilitas: 0 },
  "idempotent",
);
const w2 = (await call("listWarga")).result;
assert.equal(
  new Set(w2.map((w: any) => w.nik)).size,
  w2.length,
  "NIK still unique",
);
assert.ok(
  w2.some((w: any) => w.status === "kos") &&
    w2.some((w: any) => w.status === "kontrak"),
);
// portal by KK shows whole family history
const fam = await call("portalLookup", ["3402010101260001"], "");
assert.equal(fam.result.members.length, 4);
assert.ok(fam.result.iuran.length >= 3);
const slamet = w2.find((w: any) => w.fullName === "Slamet Riyadi");
const viaNik = await call("portalLookup", [slamet.nik], "");
assert.equal(viaNik.result.kk.number, "3402010101260001");
console.log("ALL OK");
