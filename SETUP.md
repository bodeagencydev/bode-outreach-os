# Bode Outreach OS setup

This branch adds Google sign-in, per-user Gmail account isolation, and cloud-synced workspace data. Do not put secret keys in the browser or in GitHub.

## 1. Supabase workspace table

In the existing Supabase project, open **SQL Editor** and run the contents of `supabase/workspace_state.sql`. This is an additive migration for the `workspace_state` table and its row-level security policies.

The app also expects the existing `gmail_accounts` table to have these columns: `id`, `user_id`, `email`, `refresh_token`, `enabled`, `created_at`, and `last_used_at`. Do not run the old `supabase/schema.sql` blindly against the existing project: it defines a legacy `bode_accounts` table and does not match the current Gmail API.

## 2. Configure Supabase Auth

In Supabase, open **Authentication → URL Configuration**:
- Site URL: `https://bode-outreach-os.vercel.app`
- Add `https://bode-outreach-os.vercel.app/**` to the allowed redirect URLs.

Open **Authentication → Sign In / Providers → Google** and enable Google. Use the Google OAuth client ID and client secret for this provider.

## 3. Google Cloud redirect URLs

In Google Cloud Console, open the OAuth 2.0 Web client used by the app and add both authorized redirect URIs:

- Supabase sign-in: `https://aegmjoviqqsgblkbclvw.supabase.co/auth/v1/callback`
- Gmail connection: `https://bode-outreach-os.vercel.app/api/auth/google/callback`

Keep the Gmail API enabled. Google sign-in and Gmail connection are separate flows: users sign in first, then explicitly connect each Gmail account they want the app to use.

If the Google consent screen is still in Testing mode, only accounts listed as test users can sign in. Public launch may require publishing and completing Google's verification requirements for the scopes used.

## 4. Vercel environment variables

Keep the existing secret values already configured. Confirm these variables exist in **Vercel → Project → Settings → Environment Variables**:

- `SUPABASE_URL`: the existing Supabase project URL
- `SUPABASE_ANON_KEY`: the Supabase anon/public key. The app also accepts `SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY`: server-side only; never expose it in frontend code
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`: `https://bode-outreach-os.vercel.app/api/auth/google/callback`
- `BODE_SESSION_SECRET`: at least 32 characters
- `BODE_ENCRYPTION_KEY`: exactly 64 hexadecimal characters

Redeploy after changing environment variables. Do not send any secret values in chat or add them to GitHub.

## 5. First test

1. Open the Vercel preview for this branch after it deploys.
2. Sign in with a Google account that is permitted by the consent-screen testing settings.
3. Confirm the workspace loads and shows **Synced** in the header.
4. Add a test lead and template, refresh the page, then sign in from another device/browser to check cloud sync.
5. Open **Accounts → Connect Gmail**, approve the separate Gmail permissions, and confirm only that user's Gmail account appears.
6. Confirm a connected account can create a Gmail draft for review. This build does not send email automatically.

## Current boundaries

- Leads, templates, campaigns, settings, and local queue labels sync to the signed-in user's workspace.
- Gmail account records and encrypted refresh tokens are kept server-side and scoped by authenticated user ID.
- Auto-Send is not implemented in this phase. Any later sending flow must retain human-review options, unsubscribe/suppression handling, audit logs, and conservative rate limits. Do not rotate accounts to evade Gmail limits.
