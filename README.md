# Bode Outreach OS

A multi-user outreach workspace for lead management, personalized message variants, campaign preparation, safety checks, Gmail connections, and reviewed Gmail drafts.

## Current foundation

- Google sign-in through Supabase Auth
- Per-user cloud workspace sync for leads, templates, campaigns, settings, and local queue labels
- Per-user Gmail account storage with encrypted refresh tokens
- Gmail OAuth state validation
- Duplicate lead protection and message risk checks
- Multiple subject and message variants
- Personalization variables: `{{first_name}}`, `{{company}}`, `{{website}}`, `{{observation}}`
- Gmail draft creation for human review when a Gmail account is connected
- Email-client fallback when no Gmail account is connected
- Responsive single-page interface

## Next product differentiators

1. **Personalization quality gate:** flag generic observations and missing store-specific evidence before a message can be prepared.
2. **Prospect context card:** keep the store URL, observed conversion issue, proposed fix, and evidence together for faster human review.
3. **Campaign safety meter:** explain why a message is flagged and show what needs to change, instead of only displaying a score.
4. **Reply and suppression workspace:** record replies, opt-outs, and do-not-contact addresses so future campaigns automatically skip them.
5. **Account health and audit timeline:** show draft activity, errors, daily counts, and account status without rotating accounts to bypass provider limits.

## Setup

Follow [SETUP.md](SETUP.md). This branch requires the additive `supabase/workspace_state.sql` migration and a public Supabase anon/publishable key in Vercel.

## Important

Automatic sending is not implemented in this phase. Keep human review, unsubscribe/suppression handling, activity logs, and conservative sending limits in any later sending workflow. Never store Gmail passwords or expose the Supabase service-role key in browser code.
