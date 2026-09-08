export class OAuthProviderError extends Error {
  readonly code: string | undefined;
  readonly status: number | undefined;

  constructor(
    message = "OAuth provider request failed.",
    options?: ErrorOptions & { code?: string; status?: number },
  ) {
    super(message, options);
    this.name = "OAuthProviderError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

export function requiredOAuthEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new OAuthProviderError(`OAuth provider is not configured: ${name}`);
  return value;
}

function hasValidEncryptionKey(): boolean {
  const raw = process.env["OAUTH_TOKEN_ENCRYPTION_KEY"];
  if (!raw) return false;
  if (/^[a-f\d]{64}$/i.test(raw)) return true;
  return Buffer.from(raw, "base64").length === 32;
}

export function isOAuthProviderAvailable(provider: "linkedin" | "x"): boolean {
  const prefix = provider === "linkedin" ? "LINKEDIN" : "X";
  return Boolean(
    process.env[`${prefix}_CLIENT_ID`] &&
    process.env[`${prefix}_CLIENT_SECRET`] &&
    process.env[`${prefix}_REDIRECT_URI`] &&
    hasValidEncryptionKey(),
  );
}

export function providerResponseError(
  status: number,
  body: unknown,
  fallbackMessage: string,
): OAuthProviderError {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const rawCode = record["error"] ?? record["code"];
  const rawMessage =
    record["error_description"] ?? record["message"] ?? fallbackMessage;
  const code =
    typeof rawCode === "string" && /^[a-z0-9_.-]{1,80}$/i.test(rawCode)
      ? rawCode
      : undefined;
  const message =
    typeof rawMessage === "string"
      ? rawMessage.replace(/[\r\n\t]+/g, " ").slice(0, 240)
      : fallbackMessage;
  return new OAuthProviderError(message, {
    ...(code ? { code } : {}),
    status,
  });
}
