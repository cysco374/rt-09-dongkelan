import { api } from "../api/client";

/** Stateless API client; kept as a hook so existing query hooks work unchanged. */
export function useActor() {
  return { actor: api, isFetching: false };
}
