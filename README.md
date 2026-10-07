# Bode Outreach OS

A simple outreach workspace for lead management, personalization, campaign variants, risk checks, account management and Auto Scout.

## MVP

- Lead import and validation
- Duplicate protection
- Multiple subject variants
- Multiple message variants
- Personalization variables
- Pre-send risk checks
- Campaigns
- Sender-account queue management
- Auto Scout preparation flow
- mailto handoff
- Local browser storage

## Deployment

This MVP is a static web app. Import the GitHub repository into Vercel and deploy.

## Important

The Gmail account connection layer is intentionally separate from the MVP. Do not store Gmail passwords. Future Gmail integration should use Google OAuth and should respect provider sending limits and anti-abuse rules.
