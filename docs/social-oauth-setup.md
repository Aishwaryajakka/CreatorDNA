# Social OAuth setup

## LinkedIn

1. Create or select an app in the LinkedIn Developer Portal.
2. Enable **Sign in with LinkedIn using OpenID Connect**.
3. Under Auth, register the exact redirect URI for each environment:
   - Local: `http://localhost:3000/api/integrations/linkedin/callback`
   - Production: `https://creator-dna-pi.vercel.app/api/integrations/linkedin/callback`
4. Set the server environment variables `LINKEDIN_CLIENT_ID`,
   `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI`.
5. The app requests only `openid profile email`. It does not request LinkedIn
   post-history or publishing access.

## X

1. Create or select an app in the X Developer Portal.
2. Enable OAuth 2.0 and configure it as a confidential Web App.
3. Register the exact callback URI for each environment:
   - Local: `http://localhost:3000/api/integrations/x/callback`
   - Production: `https://creator-dna-pi.vercel.app/api/integrations/x/callback`
4. Enable the scopes `tweet.read`, `users.read`, and `offline.access`.
5. Set the server environment variables `X_CLIENT_ID`, `X_CLIENT_SECRET`, and
   `X_REDIRECT_URI`.
6. Ensure the X API plan attached to the app permits user-post timeline and
   post-lookup requests. If it does not, Creator DNA keeps the connection and
   offers manual X content entry instead of fabricating import data.

Creator DNA loads up to 20 original authored posts, excluding replies and
reposts, and refetches selected post IDs from X before ingestion. Imported
posts use the existing content → Groq extraction → Jina embedding pipeline.

## Token encryption

Set `OAUTH_TOKEN_ENCRYPTION_KEY` to a cryptographically random 32-byte value,
encoded as 64 hexadecimal characters or Base64. For example, generate one
locally with `openssl rand -hex 32`. Never prefix this variable with `VITE_`.

The redirect URI environment variable must exactly match the URI registered
for the environment currently running the application.
