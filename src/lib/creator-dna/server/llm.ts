/// <reference types="node" />

import Groq from "groq-sdk";

export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

export class CreatorDNAProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CreatorDNAProviderError";
  }
}

let groqClient: Groq | undefined;

export function getGroqClient(): Groq {
  if (groqClient) return groqClient;

  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    throw new CreatorDNAProviderError(
      "Groq is not configured. Set GROQ_API_KEY on the server.",
    );
  }

  groqClient = new Groq({ apiKey });
  return groqClient;
}

export function getGroqModel(): string {
  return process.env["GROQ_MODEL"] || DEFAULT_GROQ_MODEL;
}
