export const DEMO_STORAGE_KEY = "creator-dna-demo";

export function isDemoSession() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DEMO_STORAGE_KEY) !== null;
}
