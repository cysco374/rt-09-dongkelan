import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { getGaleriImage, handleRpc } from "../lib/core.mts";

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
// ---- peran: ketua / bendahara / sekretaris
const adminTok = token;
const mkUser = (username: string, role: string, pw: string) =>
  call(
    "addUser",
    [{ username, name: username.toUpperCase(), role, passwordHash: h(pw) }],
    adminTok,
  );
assert.equal((await mkUser("pak.ketua", "ketua", "k1")).status, 200);
assert.equal((await mkUser("bu.bendahara", "bendahara", "b1")).status, 200);
assert.equal((await mkUser("bu.sekretaris", "sekretaris", "s1")).status, 200);
assert.equal(
  (await mkUser("pak.ketua", "ketua", "x")).status,
  409,
  "dup username",
);
assert.equal(
  (await mkUser("admin", "ketua", "x")).status,
  409,
  "admin name reserved",
);
assert.equal(
  (await mkUser("hacker", "admin", "x")).status,
  400,
  "cannot mint admin",
);
const login = async (u: string, p: string) => call("login", [u, h(p)], "");
const ket = (await login("pak.ketua", "k1")).result;
const ben = (await login("bu.bendahara", "b1")).result;
const sek = (await login("bu.sekretaris", "s1")).result;
assert.ok(ket && ben && sek);
assert.equal((await login("pak.ketua", "salah")).status, 401);
assert.equal((await login("tidakada", "x")).status, 401);
assert.equal((await call("whoami", [], ben)).result.r, "bendahara");

const newWarga = {
  id: "",
  nik: "3402019999999999",
  fullName: "Uji Peran",
  dob: "1990-01-01",
  gender: "male",
  address: "x",
  phone: "0",
  status: "tetap",
  kkNumber: "",
  maritalStatus: "kawin",
  job: "x",
  createdAt: { __bi: "0" },
};
const newIuran = {
  id: "",
  wargaId: wid,
  wargaName: "Uji",
  iuranType: "monthly",
  month: { __bi: "1" },
  year: { __bi: "2026" },
  total: { __bi: "25000" },
  status: "unpaid",
  createdAt: { __bi: "0" },
};
const newPeng = {
  id: "",
  title: "Uji",
  content: "isi",
  date: "2026-01-01",
  status: "active",
  createdAt: { __bi: "0" },
};
const newFas = {
  id: "",
  name: "Aset Uji",
  fasilitasType: "equipment",
  condition: "good",
  acquisitionYear: { __bi: "2024" },
  location: "x",
  description: "x",
  createdAt: { __bi: "0" },
};
// bendahara: iuran ya; warga/pengumuman/aset tidak; baca ya
assert.equal((await call("addIuran", [newIuran], ben)).status, 200);
assert.equal((await call("addWarga", [newWarga], ben)).status, 403);
assert.equal((await call("addPengumuman", [newPeng], ben)).status, 403);
assert.equal((await call("addFasilitas", [newFas], ben)).status, 403);
assert.equal((await call("listWarga", [], ben)).status, 200);
assert.equal((await call("listIuran", [], ben)).status, 200);
// sekretaris: warga/pengumuman/aset ya; iuran tidak
assert.equal((await call("addWarga", [newWarga], sek)).status, 200);
assert.equal((await call("addPengumuman", [newPeng], sek)).status, 200);
assert.equal((await call("addFasilitas", [newFas], sek)).status, 200);
assert.equal((await call("addIuran", [newIuran], sek)).status, 403);
assert.equal((await call("deleteIuran", ["x"], sek)).status, 403);
// ketua: semua; kelola akun; tapi bukan seed / kredensial admin
assert.equal((await call("addIuran", [newIuran], ket)).status, 200);
assert.equal(
  (await call("addWarga", [{ ...newWarga, nik: "3402019999999998" }], ket))
    .status,
  200,
);
assert.equal((await call("listUsers", [], ket)).result.length, 3);
assert.equal(
  (await call("listUsers", [], ket)).result[0].hash,
  undefined,
  "hash not leaked",
);
assert.equal((await call("listUsers", [], ben)).status, 403);
assert.equal((await call("seedDemo", [], ket)).status, 403);
assert.equal(
  (await call("setAdminCredentials", ["a", h("b"), h("c")], ket)).status,
  403,
);
// ganti password sendiri
assert.equal(
  (await call("changeMyPassword", [h("salah"), h("baru1")], ben)).result,
  false,
);
assert.equal(
  (await call("changeMyPassword", [h("b1"), h("baru1")], ben)).result,
  true,
);
assert.equal((await login("bu.bendahara", "b1")).status, 401);
assert.ok((await login("bu.bendahara", "baru1")).result);
// reset oleh ketua, nonaktifkan => token lama langsung ditolak
assert.equal(
  (await call("resetUserPassword", ["bu.sekretaris", h("reset1")], ket)).status,
  200,
);
assert.ok((await login("bu.sekretaris", "reset1")).result);
assert.equal(
  (
    await call(
      "updateUser",
      [{ username: "bu.bendahara", disabled: true }],
      ket,
    )
  ).status,
  200,
);
assert.equal(
  (await call("listWarga", [], ben)).status,
  401,
  "disabled => token invalid",
);
assert.equal((await login("bu.bendahara", "baru1")).status, 401);
assert.equal(
  (
    await call(
      "updateUser",
      [{ username: "bu.bendahara", disabled: false, role: "sekretaris" }],
      ket,
    )
  ).status,
  200,
);
assert.equal(
  (await call("addIuran", [newIuran], ben)).status,
  401,
  "role changed => old token invalid",
);
assert.equal((await call("deleteUser", ["bu.bendahara"], ket)).status, 200);
// admin tetap punya akses penuh
assert.equal(
  (await call("addWarga", [{ ...newWarga, nik: "3402019999999997" }], adminTok))
    .status,
  200,
);

await mkUser("bendahara2", "bendahara", "b2");
const ben2 = (await login("bendahara2", "b2")).result;
// ---- kritik & saran
const fb = (n: string, ph: string, m: string) =>
  call("submitFeedback", [n, ph, m], "");
assert.equal(
  (await fb("A", "0812345678", "Pelayanan sudah bagus")).status,
  400,
  "name too short",
);
assert.equal(
  (await fb("Ani", "abc", "Pelayanan sudah bagus")).status,
  400,
  "bad phone",
);
assert.equal(
  (await fb("Ani", "0812345678", "ok")).status,
  400,
  "msg too short",
);
assert.equal(
  (await fb("Ani", "0812-3456-78", "Tolong perbaiki lampu jalan gang 2"))
    .status,
  200,
);
assert.equal(
  (await fb("Ani", "081234567 8", "Tolong perbaiki lampu jalan gang 2")).status,
  409,
  "duplicate",
);
for (let k = 0; k < 4; k++)
  await fb("Ani", "08123456 78", `Masukan nomor ${k} dari Ani`);
assert.equal(
  (await fb("Ani", "0812345678", "Masukan keenam dari Ani")).status,
  429,
  "daily cap",
);
const pubList = (await call("listFeedbackPublic", [], "")).result;
assert.equal(pubList.length, 5);
assert.equal(pubList[0].phone, undefined, "phone never public");
assert.equal(pubList[0].name, "Ani");
assert.equal(
  (await call("listFeedback", [], "")).status,
  401,
  "full list is private",
);
const full = await call("listFeedback", [], ket);
assert.equal(full.status, 200);
assert.equal(full.result[0].phone, "0812345678");
assert.equal(
  (await call("addFeedback", [{}], adminTok)).status,
  404,
  "no admin-side add",
);
const fid = pubList[0].id;
assert.equal(
  (await call("deleteFeedback", [fid], ben2)).status,
  403,
  "bendahara cannot delete",
);
assert.equal((await call("deleteFeedback", [fid], ket)).status, 200);
assert.equal((await call("listFeedbackPublic", [], "")).result.length, 4);

// ---- galeri
const PNG =
  "data:image/png;base64," +
  Buffer.concat([
    Buffer.from([0x89]),
    Buffer.from("PNG\r\n\x1a\n"),
    Buffer.alloc(200),
  ]).toString("base64");
const gal = {
  title: "Kerja Bakti",
  description: "Bersih kampung bersama warga",
  date: "2026-11-09",
};
assert.equal((await call("saveGaleri", [gal, PNG], "")).status, 401);
assert.equal(
  (await call("saveGaleri", [gal, PNG], ben2)).status,
  403,
  "bendahara cannot",
);
assert.equal(
  (await call("saveGaleri", [gal, undefined], ket)).status,
  400,
  "photo required",
);
assert.equal(
  (await call("saveGaleri", [gal, "data:text/html;base64,PGI+"], ket)).status,
  400,
  "not image",
);
assert.equal(
  (
    await call(
      "saveGaleri",
      [
        gal,
        "data:image/png;base64," + Buffer.from("not a png").toString("base64"),
      ],
      ket,
    )
  ).status,
  400,
  "bad magic",
);
assert.equal(
  (
    await call(
      "saveGaleri",
      [
        gal,
        "data:image/jpeg;base64," +
          Buffer.alloc(700 * 1024, 0xff).toString("base64"),
      ],
      ket,
    )
  ).status,
  413,
);
const g1 = await call("saveGaleri", [gal, PNG], sek);
assert.equal(g1.status, 200, JSON.stringify(g1));
await call(
  "saveGaleri",
  [{ ...gal, title: "Ronda Malam", date: "2026-11-12" }, PNG],
  ket,
);
const gl = (await call("listGaleri", [], "")).result;
assert.equal(gl.length, 2);
assert.equal(gl[0].title, "Ronda Malam", "newest date first");
assert.equal(gl[0].imageVersion > 0, true);
assert.equal(
  (await getGaleriImage(store as never, g1.result))?.ct,
  "image/png",
);
assert.equal(
  await getGaleriImage(store as never, "../meta/admin"),
  null,
  "id validated",
);
// edit tanpa ganti foto mempertahankan foto
const edited = await call(
  "saveGaleri",
  [{ ...gal, id: g1.result, title: "Kerja Bakti Akbar" }],
  ket,
);
assert.equal(edited.status, 200);
assert.ok(await getGaleriImage(store as never, g1.result));
assert.equal(
  (await call("saveGaleri", [{ ...gal, id: "galeri_1_abcdef" }], ket)).status,
  404,
);
assert.equal((await call("deleteGaleri", [g1.result], ben2)).status, 403);
assert.equal((await call("deleteGaleri", [g1.result], ket)).status, 200);
assert.equal(
  await getGaleriImage(store as never, g1.result),
  null,
  "image removed with item",
);
assert.equal((await call("addGaleri", [{}], adminTok)).status, 404);
console.log("ALL OK");
