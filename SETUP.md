# Bode Outreach OS: Gmail setup

The current site can run without Gmail. To activate Google OAuth and Gmail draft creation, configure these once.

## 1. Supabase

Create a free Supabase project. Open SQL Editor and run supabase/schema.sql from this repository.

Copy the Project URL and Service role key. Keep the service role key private. It belongs only in Vercel environment variables.

## 2. Google Cloud

Create a Google Cloud project and enable the Gmail API.

Create an OAuth 2.0 Web application client.

Authorized redirect URI:
https://YOUR-VERCEL-DOMAIN/api/auth/google/callback

Use the resulting client ID and client secret in Vercel.

The app requests openid, email, Gmail send, and Gmail modify. The application uses the Gmail connection to create drafts for review. It does not store Gmail passwords.

## 3. Vercel environment variables

BODE_ACCESS_KEY = a long private key you choose
BODE_SESSION_SECRET = a long random secret
BODE_ENCRYPTION_KEY = exactly 64 hexadecimal characters (32 bytes)
GOOGLE_CLIENT_ID = Google OAuth client ID
GOOGLE_CLIENT_SECRET = Google OAuth client secret
GOOGLE_REDIRECT_URI = your exact Vercel callback URL
SUPABASE_URL = Supabase project URL
SUPABASE_SERVICE_ROLE_KEY = Supabase service role key

## 4. First use

Open Accounts. Unlock workspace with BODE_ACCESS_KEY. Tap Connect Gmail. Complete Google consent. Return to Accounts. Connect the other Gmail accounts the same way.

## 5. Auto Scout

The intended flow is: lead -> personalization -> risk checks -> select eligible connected account -> create Gmail draft -> log draft -> next lead.

The account selector must never be used to bypass Gmail sending limits. It is only a queue/account-management mechanism.
