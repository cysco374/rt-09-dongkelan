import { getToken, setToken } from "../api/client";

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function login(token: string): void {
  setToken(token);
}

export function logout(): void {
  setToken(null);
}

const useAdminAuth = { isLoggedIn, login, logout };
export default useAdminAuth;
