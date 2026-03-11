const SESSION_KEY = "rt09_admin_session";

export function isLoggedIn(): boolean {
  return localStorage.getItem(SESSION_KEY) === "true";
}

export function login(): void {
  localStorage.setItem(SESSION_KEY, "true");
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

const useAdminAuth = { isLoggedIn, login, logout };
export default useAdminAuth;
