import type { backendInterface } from "../backend.d";

const SESSION_KEY = "rt09_admin_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

export type Role = "admin" | "ketua" | "bendahara" | "sekretaris";
export interface Session {
  u: string;
  r: Role;
  n: string;
}
export const roleLabel: Record<Role, string> = {
  admin: "Administrator",
  ketua: "Ketua RT",
  bendahara: "Bendahara",
  sekretaris: "Sekretaris",
};
/** Peran dibaca dari token (hanya untuk menyesuaikan tampilan; server tetap memeriksa hak akses). */
export function getSession(): Session | null {
  const t = getToken();
  if (!t) return null;
  try {
    const b = t.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const j = JSON.parse(decodeURIComponent(escape(atob(b))));
    return { u: j.u, r: j.r ?? "admin", n: j.n ?? j.u };
  } catch {
    return null;
  }
}
/** Menu/halaman dashboard yang boleh dibuka tiap peran. */
const AREAS: Record<string, Role[]> = {
  "/dashboard": ["admin", "ketua", "bendahara", "sekretaris"],
  "/dashboard/warga": ["admin", "ketua", "sekretaris"],
  "/dashboard/kk": ["admin", "ketua", "sekretaris"],
  "/dashboard/pengumuman": ["admin", "ketua", "sekretaris"],
  "/dashboard/iuran": ["admin", "ketua", "bendahara"],
  "/dashboard/laporan": ["admin", "ketua", "bendahara", "sekretaris"],
  "/dashboard/surat": ["admin", "ketua", "sekretaris"],
  "/dashboard/fasilitas": ["admin", "ketua", "sekretaris"],
  "/dashboard/pengurus": ["admin", "ketua", "sekretaris"],
  "/dashboard/galeri": ["admin", "ketua", "sekretaris"],
  "/dashboard/kritik-saran": ["admin", "ketua", "bendahara", "sekretaris"],
  "/dashboard/pengguna": ["admin", "ketua"],
  "/dashboard/pengaturan": ["admin", "ketua", "bendahara", "sekretaris"],
};
export const canOpen = (role: Role | undefined, path: string) =>
  !!role && (AREAS[path]?.includes(role) ?? false);

export interface FeedbackPublic {
  id: string;
  name: string;
  message: string;
  createdAt: bigint;
}
export interface FeedbackFull extends FeedbackPublic {
  phone: string;
}

export interface GaleriItem {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  imageUrl: string; // Cloudinary secure_url
  publicId: string;
  createdAt: bigint;
}
/** URL Cloudinary dengan transformasi otomatis (format & kualitas) dan lebar tertentu. */
export const galeriImg = (g: GaleriItem, width = 800) =>
  g.imageUrl.replace(
    "/image/upload/",
    `/image/upload/f_auto,q_auto,w_${width}/`,
  );

export interface CloudinarySign {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export interface AppUser {
  username: string;
  name: string;
  role: Exclude<Role, "admin">;
  disabled: boolean;
  createdAt: number;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function rpc<T>(method: string, args: unknown[] = []): Promise<T> {
  const token = getToken();
  const body = JSON.stringify({ method, args }, (_k, v) =>
    typeof v === "bigint" ? { __bi: v.toString() } : v,
  );
  const res = await fetch("/api/rpc", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
  const text = await res.text();
  let data: { result?: unknown; error?: string } = {};
  try {
    data = JSON.parse(text, (_k, v) =>
      v && typeof v === "object" && "__bi" in v ? BigInt(v.__bi) : v,
    );
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    if (res.status === 401 && token && method !== "login") {
      setToken(null);
      if (!location.pathname.startsWith("/login")) location.assign("/login");
    }
    throw new ApiError(
      res.status,
      data.error ?? `Permintaan gagal (${res.status})`,
    );
  }
  return (data.result ?? null) as T;
}

/** Portal (public) responses */
export interface PortalLookup {
  kk: { number: string; head: string; address: string };
  members: { id: string; fullName: string }[];
  iuran: import("../backend.d").IuranData[];
  surat: import("../backend.d").SuratData[];
}

export interface ApiActor extends backendInterface {
  login(username: string, passwordHash: string): Promise<string>;
  whoami(): Promise<Session>;
  listGaleri(): Promise<GaleriItem[]>;
  galeriUploadSign(): Promise<CloudinarySign>;
  saveGaleri(
    d: { id?: string; title: string; description: string; date: string },
    image?: { imageUrl: string; publicId: string },
  ): Promise<string>;
  deleteGaleri(id: string): Promise<void>;
  submitFeedback(name: string, phone: string, message: string): Promise<string>;
  listFeedbackPublic(): Promise<FeedbackPublic[]>;
  listFeedback(): Promise<FeedbackFull[]>;
  deleteFeedback(id: string): Promise<void>;
  listUsers(): Promise<AppUser[]>;
  addUser(d: {
    username: string;
    name: string;
    role: AppUser["role"];
    passwordHash: string;
  }): Promise<string>;
  updateUser(d: {
    username: string;
    name?: string;
    role?: AppUser["role"];
    disabled?: boolean;
  }): Promise<void>;
  resetUserPassword(username: string, passwordHash: string): Promise<void>;
  deleteUser(username: string): Promise<void>;
  changeMyPassword(current: string, next: string): Promise<boolean>;
  portalLookup(key: string): Promise<PortalLookup | null>;
  seedDemo(): Promise<{ kk: number; warga: number; fasilitas: number }>;
  seedDemoMore(): Promise<{
    kk: number;
    warga: number;
    iuran: number;
    fasilitas: number;
  }>;
  portalSubmitSurat(
    key: string,
    wargaId: string,
    suratType: string,
    purpose: string,
  ): Promise<string>;
}

const names = [
  "addFasilitas",
  "addIuran",
  "addKK",
  "addPengumuman",
  "addPengurus",
  "addSurat",
  "addWarga",
  "deleteFasilitas",
  "deleteIuran",
  "deleteKK",
  "deletePengumuman",
  "deletePengurus",
  "deleteSurat",
  "deleteWarga",
  "filterIuranByMonthYear",
  "filterIuranByStatus",
  "filterIuranByWarga",
  "filterSuratByStatus",
  "filterSuratByWarga",
  "filterWargaByKK",
  "filterWargaByStatus",
  "getAdminUsername",
  "getFasilitas",
  "getIuran",
  "getKK",
  "getPengumuman",
  "getPengurus",
  "getStatistics",
  "getSurat",
  "getWarga",
  "getWebsiteSettings",
  "listActivePengumuman",
  "listFasilitas",
  "listIuran",
  "listKK",
  "listPengumuman",
  "listPengurus",
  "listSurat",
  "listWarga",
  "setAdminCredentials",
  "setWebsiteSettings",
  "updateFasilitas",
  "updateIuran",
  "updateKK",
  "updatePengumuman",
  "updatePengurus",
  "updateSurat",
  "updateWarga",
  "login",
  "portalLookup",
  "portalSubmitSurat",
  "seedDemo",
  "seedDemoMore",
  "whoami",
  "listGaleri",
  "galeriUploadSign",
  "saveGaleri",
  "deleteGaleri",
  "submitFeedback",
  "listFeedbackPublic",
  "listFeedback",
  "deleteFeedback",
  "listUsers",
  "addUser",
  "updateUser",
  "resetUserPassword",
  "deleteUser",
  "changeMyPassword",
] as const;

export const api = Object.fromEntries(
  names.map((n) => [n, (...args: unknown[]) => rpc(n, args)]),
) as unknown as ApiActor;

// Legacy shape expected by callers of the old canister interface
(api as { verifyAdminCredentials: unknown }).verifyAdminCredentials = async (
  username: string,
  passwordHash: string,
) => {
  try {
    await rpc("login", [username, passwordHash]);
    return true;
  } catch {
    return false;
  }
};
