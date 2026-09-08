/// <reference types="node" />

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

type EncryptedPayload = {
  version: 1;
  iv: string;
  authTag: string;
  ciphertext: string;
};

function encryptionKey(): Buffer {
  const raw = process.env["OAUTH_TOKEN_ENCRYPTION_KEY"];
  if (!raw)
    throw new Error(
      "Missing required server environment variable: OAUTH_TOKEN_ENCRYPTION_KEY",
    );
  const key = /^[a-f\d]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32)
    throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY must encode exactly 32 bytes.");
  return key;
}

export function encryptToken(value: string): string {
  if (!value) throw new Error("Cannot encrypt an empty OAuth token.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const payload: EncryptedPayload = {
    version: 1,
    iv: iv.toString("base64url"),
    authTag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
  return JSON.stringify(payload);
}

export function decryptToken(value: string): string {
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(value) as EncryptedPayload;
  } catch {
    throw new Error("Stored OAuth token is invalid.");
  }
  if (
    payload.version !== 1 ||
    !payload.iv ||
    !payload.authTag ||
    !payload.ciphertext
  )
    throw new Error("Stored OAuth token is invalid.");
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(payload.iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Stored OAuth token could not be decrypted.");
  }
}

export function hashOAuthState(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
