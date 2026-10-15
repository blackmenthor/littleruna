# Little Runa

Landing page for Little Runa: girls' clothes sewn from revived fabrics. English and Indonesian. Articles come from Sanity when it is connected, and the contact form sends mail through Resend.

The site is a skeleton. Copy, photos, and the three services still need the real accounts. The steps are in [docs/SETUP.md](docs/SETUP.md).

```sh
npm install
npm run dev
```

Open http://localhost:4321. It redirects to `/en`. Indonesian is `/id`.

## Environment

Nothing here is committed with a real value. Copy [.env.example](.env.example) to `.env` for local `astro dev`. Leave a value blank and that feature stays off.

`PUBLIC_` names are baked into the HTML at **build** time. They have to be present for `npm run build`, including the GitHub Action that deploys. The mail and list names are read on the Worker at **request** time. Do not prefix those with `PUBLIC_`.

### Build-time (`PUBLIC_`)

Set these in `.env` locally. For GitHub Actions, set the same names as repository **variables** or **secrets** (the workflow checks variables first). They are not secret: they end up in the HTML.

| Name | Required | What it is |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | For a real deploy | Origin used in the sitemap and canonical links, such as `https://littleruna.com`. A build without it uses `http://localhost:4321`. |
| `PUBLIC_SANITY_PROJECT_ID` | No | Sanity project. Empty keeps the two starter journal notes. |
| `PUBLIC_SANITY_DATASET` | No | Defaults to `production`. |
| `PUBLIC_CF_BEACON_TOKEN` | No | Cloudflare Web Analytics site token. Empty means the beacon is not added. |
| `PUBLIC_GA4_ID` | No | GA4 measurement id, shaped like `G-XXXXXXXX`. Empty means Google Analytics is not loaded. |

### Worker secrets (runtime)

Set these on the `littleruna` Worker. They are not GitHub Actions secrets, and a deploy does not delete them.

```sh
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_TO_EMAIL
npx wrangler secret put CONTACT_FROM_EMAIL
npx wrangler secret put RESEND_AUDIENCE_ID
```

For `astro dev`, put the same names in `.env`.

| Name | Required | What it is |
| --- | --- | --- |
| `RESEND_API_KEY` | For mail and the list | Resend API key that can **send email and create contacts**. A send-only key can deliver the contact form and still fail the list. |
| `CONTACT_TO_EMAIL` | For the contact form | Inbox that receives questions and piece requests. |
| `CONTACT_FROM_EMAIL` | For the contact form | Verified sender, for example `Little Runa <hello@littleruna.com>`. |
| `RESEND_AUDIENCE_ID` | For the list | Segment id. Resend renamed Audiences to Segments in November 2025. Create a segment, copy its id, and store it in this name. |

In Resend, also create a string contact property named `country`. The list form sends the country there (Germany, Spain, France, Turkey, Indonesia, or “somewhere else”). If the property does not exist, the email is still saved and the country is skipped. The Worker log says so.

### GitHub Actions secrets for deploy

These two do not exist until you create them. The workflow will not deploy without them. Pull requests only build.

| Secret | Where the value comes from |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token below. Never commit it. |
| `CLOUDFLARE_ACCOUNT_ID` | The account that owns the Worker `littleruna`. Dashboard → the domain or Workers overview → the API section on the side. See [Find account and zone IDs](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/). |

Repository → Settings → Secrets and variables → Actions → New repository secret.

Create the token as an **account API token** (Manage Account → Account API tokens), limited to the one account:

1. Use the template **Edit Cloudflare Workers** if that template is in the list. Cloudflare’s [GitHub Actions guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) still names that template. Scope it to the account that owns `littleruna`.
2. If the dashboard shows the newer Workers roles instead, choose **Workers Editor** on the existing Worker `littleruna` (Specified Workers). Editor can deploy a Worker that already exists. Product-level Admin is only needed to create a Worker, and this one already exists.

Do not grant Zone → Workers Routes → Edit. This repo does not list routes, so deploy does not change `*littleruna.com/*`. Add that zone permission later only if a `routes` entry is added to `wrangler.jsonc`. Adding routes makes Wrangler replace the routes already on the Worker.

If a deploy fails while looking up the account, add Account → Account Settings → Read and create a new token. A user token (My Profile → API Tokens) also needs User → User Details → Read and User → Memberships → Read. An account token does not.

`wrangler.jsonc` sets `keep_vars`, so a deploy keeps plain-text variables you added in the dashboard. Secrets are kept either way.

### Analytics, in the dashboards

Cloudflare Web Analytics → the `littleruna.com` site → Manage site. Use **Enable with JS Snippet installation**, not automatic injection. Automatic injection does not show up on this Worker, and if it starts working later a second beacon on the same page is ignored. Copy only the token from `data-cf-beacon` into `PUBLIC_CF_BEACON_TOKEN`, then rebuild. The beacon does not use a cookie and loads without the consent banner.

GA4 → Admin → Data streams → the web stream → Measurement ID into `PUBLIC_GA4_ID`, then rebuild. The tag is not in the HTML until a visitor presses Accept. Consent Mode defaults are denied before that. Accept also allows a future Meta or TikTok tag. Those tags are not installed. A later tag has to call `LittleRuna.allows('marketing')` and must not be hard-coded in the page.

Joining the list sends GA4 `sign_up` with `method: newsletter`. A real contact-form send sends `generate_lead` with `method: contact`. Both wait until analytics consent. Reject drops the event. A honeypot hit does not send one.

### What you still do by hand

1. Create `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the repository secrets.
2. Set `PUBLIC_SITE_URL` (and any other `PUBLIC_` names you want) as repository variables, then let a push to `main` build and deploy. Until those secrets exist, the deploy step fails and the Worker already online is left as it is.
3. `wrangler secret put` the four runtime names above, on the `littleruna` Worker.
4. Create the Resend segment and the `country` property. Verify the sending domain.
5. Turn Web Analytics to manual snippet mode and, if you want GA4, create the measurement id. Put both in the `PUBLIC_` build variables and deploy again.
