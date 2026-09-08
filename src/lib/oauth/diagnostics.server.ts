import { OAuthProviderError } from "./provider-error.server";
import type { SocialProvider } from "./types";

type OAuthDiagnostic = {
  step: string;
  clientType?: "admin" | "user" | "unknown";
  codePresent?: boolean;
  statePresent?: boolean;
  providerErrorPresent?: boolean;
  connectionSaved?: boolean;
  status?: number;
  code?: string;
  message?: string;
};

export function oauthDiagnostic(
  provider: SocialProvider,
  diagnostic: OAuthDiagnostic,
): void {
  if (process.env["NODE_ENV"] === "production") return;

  console.info("[oauth]", {
    provider,
    step: diagnostic.step,
    ...(diagnostic.clientType ? { clientType: diagnostic.clientType } : {}),
    ...(diagnostic.codePresent === undefined
      ? {}
      : { codePresent: diagnostic.codePresent }),
    ...(diagnostic.statePresent === undefined
      ? {}
      : { statePresent: diagnostic.statePresent }),
    ...(diagnostic.providerErrorPresent === undefined
      ? {}
      : { providerErrorPresent: diagnostic.providerErrorPresent }),
    ...(diagnostic.connectionSaved === undefined
      ? {}
      : { connectionSaved: diagnostic.connectionSaved }),
    ...(diagnostic.status === undefined ? {} : { status: diagnostic.status }),
    ...(diagnostic.code ? { code: diagnostic.code } : {}),
    ...(diagnostic.message ? { message: diagnostic.message } : {}),
  });
}

export function safeOAuthError(error: unknown): {
  code?: string;
  message: string;
  status?: number;
} {
  if (error instanceof OAuthProviderError) {
    return {
      ...(error.code ? { code: error.code } : {}),
      message: error.message,
      ...(error.status === undefined ? {} : { status: error.status }),
    };
  }

  return {
    message: error instanceof Error ? error.message : "OAuth operation failed.",
  };
}
