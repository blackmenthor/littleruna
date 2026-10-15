# Little Runa

Landing page for Little Runa: girls' clothes sewn from revived fabrics. English and Indonesian. Articles come from Sanity when it is connected, and the contact form sends mail through Resend.

The site is a skeleton. Copy, photos, and the three services still need the real accounts. The steps are in [docs/SETUP.md](docs/SETUP.md).

```sh
npm install
npm run dev
```

Open http://localhost:4321. It redirects to `/en`. Indonesian is `/id`.

## Environment variables and secrets

The site builds with every value empty. Analytics and the waitlist do nothing until the values below are set. `PUBLIC_` names are folded into the pages by `npm run build`. The others stay on the server.

Copy `.env.example` to `.env` for local dev. For GitHub, the same `PUBLIC_` names are Actions **variables** (Settings → Secrets and variables → Actions → Variables), because the workflow bakes them in when it builds.

| Variable | Where it lives | What it does |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | Build | Canonical origin, such as `https://littleruna.com`. The workflow uses that default when the variable is empty. |
| `PUBLIC_SANITY_PROJECT_ID` | Build | Sanity project. Empty keeps the starter journal. |
| `PUBLIC_SANITY_DATASET` | Build | Sanity dataset. Defaults to `production`. |
| `PUBLIC_CF_BEACON_TOKEN` | Build | Cloudflare Web Analytics site token. Empty skips the beacon. The beacon is cookieless and loads without cookie consent. |
| `PUBLIC_GA4_ID` | Build | GA4 measurement id (`G-…`). Empty skips Google Analytics. The tag loads only after analytics consent. |
| `RESEND_API_KEY` | Worker secret | Sends contact mail and creates waitlist contacts. |
| `RESEND_AUDIENCE_ID` | Worker secret | Resend audience id, or the segment id Resend now uses in place of an audience. |
| `CONTACT_TO_EMAIL` | Worker secret | Inbox for questions and piece requests. |
| `CONTACT_FROM_EMAIL` | Worker secret | From address on a domain verified in Resend. |

In Cloudflare Web Analytics, set the site to **Enable with JS Snippet installation**. Automatic injection does not appear on this Worker, and an automatic mode rejects events from the manual snippet.

Optional country on the waitlist is saved as a Resend contact property named `country`. Create that property (text) if you want it kept. Signups still succeed when the property is missing.

Set the worker secrets once. A later deploy does not erase them.

```sh
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_AUDIENCE_ID
npx wrangler secret put CONTACT_TO_EMAIL
npx wrangler secret put CONTACT_FROM_EMAIL
```

### GitHub Actions

`.github/workflows/ci.yml` runs `npm ci` and `npm run build` on pull requests and on pushes to `main`. A push to `main` also runs `npm run deploy` (`wrangler deploy`). That step reads two repository **secrets** and fails until they exist. This repo does not assume they are set.

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token Wrangler uses to deploy. |
| `CLOUDFLARE_ACCOUNT_ID` | Account that owns the `littleruna` worker. |

Create a custom token (or start from the **Edit Cloudflare Workers** template and remove what this site does not use). Scope it to that account and to the `littleruna.com` zone.

- Account → Workers Scripts → Edit
- Account → Account Settings → Read
- Zone → Workers Routes → Edit, for `littleruna.com`, so deploys can keep the `*littleruna.com/*` route
- Zone → Zone → Read, for `littleruna.com`

The worker already exists, so the token does not need permission to create workers. Do not commit the token. The route can stay as it is in the dashboard: `wrangler.jsonc` does not list routes, and deploy leaves dashboard routes in place.
