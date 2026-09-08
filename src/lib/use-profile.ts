import { useAuthState } from "./auth-state";
export function useProfile() {
  return useAuthState().profile;
}
