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
