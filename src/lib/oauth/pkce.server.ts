/// <reference types="node" />

import { createHash, randomBytes } from "node:crypto";

export function createPkcePair() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function isTokenNearExpiry(
  expiresAt: string | null,
  thresholdMs = 5 * 60 * 1000,
) {
  return !expiresAt || Date.parse(expiresAt) - Date.now() <= thresholdMs;
}
