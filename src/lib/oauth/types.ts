export type SocialProvider = "linkedin" | "x";

export type SanitizedSocialConnection = {
  provider: SocialProvider;
  available: true;
  connected: true;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  scopes: string[];
  connectedAt: string;
};

export type IntegrationStatus = {
  linkedin:
    | SanitizedSocialConnection
    | { provider: "linkedin"; available: boolean; connected: false };
  x:
    | SanitizedSocialConnection
    | { provider: "x"; available: boolean; connected: false };
};
