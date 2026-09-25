# Setup

The site runs without accounts. Homepage, styles, journal, and the contact form all render. Mail is sent only after Resend is filled in. Journal articles switch from the two starter notes to Sanity only after a project id is present **at build time**.

## What is already wired

| Piece | Where | Empty until |
| --- | --- | --- |
| Pages | `src/pages/[lang]/` | — |
| Style photos | `src/assets/styles/` | New photos are added with `scripts/optimize-styles.sh` |
| Journal | `src/lib/journal.ts` reads Sanity, otherwise `src/data/journal.ts` | `PUBLIC_SANITY_PROJECT_ID` |
| Contact mail | `src/pages/api/contact.ts` calls `https://api.resend.com/emails` | `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` |
| Hosting | `@astrojs/cloudflare`, config in `wrangler.jsonc` | `npm run deploy` |

`PUBLIC_` variables are read while the site is built and baked into the HTML. The three mail variables stay on the server. Do not prefix them with `PUBLIC_`.

## 1. Local

```sh
cp .env.example .env
npm install
npm run dev
```

`astro dev` reads `.env`. Leave the values blank to click through the site. The contact form then answers that email is not connected yet.

## 2. Sanity

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage). The free plan is enough. The dataset has to be public, which is the only kind the free plan allows. That matches this site: articles are public.
2. Put the project id in `.env`:

```
PUBLIC_SANITY_PROJECT_ID=your_project_id
PUBLIC_SANITY_DATASET=production
```

3. Start the studio and log in:

```sh
npm run studio
```

4. Create an **Article**. English title and slug are required. Indonesian title, excerpt, and body are optional; if Indonesian is empty, the English text is shown on `/id`. Body is plain text. A blank line starts a new paragraph.
5. Optional, so the studio is not only on your machine:

```sh
npm run studio:deploy
```

6. Rebuild the website after articles exist. `npm run dev` picks up `.env` immediately. A Cloudflare build does not, unless those two `PUBLIC_` variables are set in the build environment.

If the project id is set and the query fails or returns nothing, the journal is empty. The starter notes are only used when the project id is missing.

## 3. Resend

1. Create an API key at [resend.com](https://resend.com).
2. Verify the domain that will send mail. `CONTACT_FROM_EMAIL` must use that domain, for example `Little Runa <hello@your-domain.com>`.
3. `CONTACT_TO_EMAIL` is the inbox that receives questions and piece requests.
4. Put the three values in `.env` for `astro dev`.

The form posts to `/api/contact`. It asks for a name, email, region (Europe, Indonesia, or somewhere else), whether the note is a question or a request, a message, and consent. A hidden company field is ignored when filled, so simple bots get a fake success.

## 4. Cloudflare

`@astrojs/cloudflare` 14 deploys a **Worker with static assets**, not a classic Pages project. The dashboard product is Workers. Pages is the older static host and does not match this build output (`dist/client` for HTML, `dist/server` for the contact endpoint).

Build, then deploy:

```sh
npm run build
npm run deploy
```

`npm run deploy` runs `wrangler deploy --config dist/server/wrangler.json`. The first time, Wrangler asks you to log in and will create a worker named `littleruna`.

Set the mail values as secrets, not as `PUBLIC_` build variables:

```sh
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_TO_EMAIL
npx wrangler secret put CONTACT_FROM_EMAIL
```

In the Cloudflare build settings, if the build happens there instead of on your machine:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy --config dist/server/wrangler.json`

Add these as **build** environment variables, because they are compiled into the pages:

- `PUBLIC_SITE_URL` — the real origin, such as `https://littleruna.com`
- `PUBLIC_SANITY_PROJECT_ID`
- `PUBLIC_SANITY_DATASET` — `production`

After changing a `PUBLIC_` variable or publishing an article, build again. Secrets can change without a rebuild.

### Domain

The worker gets a `*.workers.dev` hostname first. In the Cloudflare dashboard, attach the domain you already own to the worker, and point DNS at it. Then set `PUBLIC_SITE_URL` to that origin and rebuild so the sitemap uses it.

## 5. Photos

Originals live in `Styles/<NAME>/` on this machine. That folder is gitignored. The site uses resized JPEGs in `src/assets/styles/<name>/`.

To refresh them after new photos are added (up to four per style):

```sh
sh scripts/optimize-styles.sh
```

`sips` is the macOS tool that converts HEIC. Run it outside a sandbox so HEIC files are not written out black.

Style names and the short descriptions are in `src/lib/styles.ts`. The order on the site is alphabetical.

## Pages

| URL | Role |
| --- | --- |
| `/` | Redirects to `/en` |
| `/en`, `/id` | Home, in the shape of the Bachaa landing: large style tiles, a style rail, the story, journal |
| `/en/styles`, `/id/styles` | All styles |
| `/en/styles/fiora` | One style and its photos |
| `/en/journal` | Articles |
| `/en/about` | Story |
| `/en/contact` | Form |
| `/en/privacy` | What the form stores |

There is no cart. A request is an email.
