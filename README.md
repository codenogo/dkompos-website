# Dkompos

**Audiophile-first music player, DJ workspace, and library for macOS.**

**[Download for macOS →](https://www.dkompos.com/)** &nbsp;·&nbsp; [Release notes](https://www.dkompos.com/releases.html) &nbsp;·&nbsp; [Feedback](https://www.dkompos.com/contact.html) &nbsp;·&nbsp; [Privacy](https://www.dkompos.com/privacy.html)

Dkompos is a free, signed, notarised macOS application for people who care about how music sounds and how a library is held. It runs locally — no accounts, no uploads, no telemetry.

## What it is

- **Visible signal path.** Exclusive output, DSP bypass when you want the source untouched. Sample rate, bit depth, DSP state, and output device shown in real time.
- **Hi-res aware.** Bit-perfect FLAC playback up to 24/192. Parametric EQ, crossfeed, upsampling, and ReplayGain when you want them; out of the chain when you don't.
- **On-device intelligence.** Every track analysed locally: BPM, Camelot key, LUFS loudness, energy, valence, danceability, and a semantic music embedding. Smart playlists you write once.
- **DJ workflow.** Crates, triage, set composition with key/tempo/energy alongside track names, and export in the format the booth expects.
- **Audiobooks, properly.** Long-form titles sit alongside music with per-title resume, chapter navigation, and natural file ordering.
- **Local-first.** No account, no uploads, no analytics. The library and the model stay on your Mac.

## System requirements

| | |
|---|---|
| **OS** | macOS 14 or newer |
| **CPU** | Apple Silicon (M1 and later) |
| **Distribution** | Signed Developer ID, Apple-notarised, stapled DMG |
| **Current version** | 1.5.8 |

The latest DMG, SHA-256 checksum, and full release notes are at **[dkompos.com/releases.html](https://www.dkompos.com/releases.html)**.

---

## About this repository

This repo hosts the **dkompos.com marketing site** and the public **Release DMGs** for the Dkompos macOS app.

The site itself is mostly static HTML / CSS / SVG / PNG. The feedback form is handled by a
Cloudflare Pages Function in `functions/api/feedback.js`.

### Local preview

```bash
python3 -m http.server 8080
```

Then open <http://127.0.0.1:8080>.

To test the feedback endpoint locally, use Cloudflare Pages dev instead:

```bash
npx wrangler pages dev . --port 8788
```

Then open <http://127.0.0.1:8788/contact>.

### Layout

| Path | Purpose |
|---|---|
| `index.html` | Home |
| `releases.html` | Release notes for every published build |
| `privacy.html` | Privacy stance |
| `contact.html` | Feedback and support contact |
| `styles.css` | All styling, single token system |
| `assets/contact.js` | Progressive enhancement for the feedback form |
| `functions/api/feedback.js` | Server-side feedback endpoint for Cloudflare Pages |
| `wrangler.toml` | Cloudflare Pages project and compatibility configuration |
| `_headers` | Security headers (CSP, HSTS, nosniff, …) applied on every route |
| `robots.txt` / `sitemap.xml` | Search-engine plumbing |
| `scripts/release.mjs` | One-shot current-version bump across the site |
| `assets/brand/` | Brand mark and wordmark SVGs |
| `assets/screens/` | Product screenshots |

### Fonts

Inter + JetBrains Mono via [Bunny Fonts](https://fonts.bunny.net) — a privacy-friendly Google Fonts mirror, no cookies, no tracking.

### Deploy

Deploys as a static directory to any host (Cloudflare Pages, GitHub Pages, Netlify, Vercel, S3+CloudFront). The publish directory is the repo root.

Cloudflare Pages is preferred because the feedback endpoint uses Pages Functions.

### Feedback delivery

The public form posts to `/api/feedback`. It validates input, rejects obvious spam
with a honeypot field, and then delivers the note using the first configured
runtime binding:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Preferred production option for Cloudflare Pages; sends feedback as email through Resend |
| `FEEDBACK_TO_EMAIL` | Destination inbox; defaults to `hello@dkompos.com` |
| `FEEDBACK_FROM_EMAIL` | Verified sender address; defaults to `Dkompos Feedback <feedback@dkompos.com>` for Resend |
| `FEEDBACK_WEBHOOK_URL` | Optional generic JSON webhook fallback |
| `FEEDBACK_WEBHOOK_TOKEN` | Optional bearer token for the webhook |

Configure secrets with Wrangler:

```bash
npx wrangler pages secret put RESEND_API_KEY --project-name dkompos
```

Non-secret values can be added under **Settings -> Variables and Secrets**. If
no delivery binding is configured, the browser opens a prefilled email draft and
the endpoint does not store the message.

Cloudflare Email Service can be used if this endpoint is moved to a Worker, or
if Pages later supports `send_email` bindings in project configuration. The
function already accepts an `FEEDBACK_EMAIL` binding when one is available, but
Wrangler 4.93 does not allow that binding on Pages projects.

### Distribution

The public Download CTA points at the notarised GitHub Release asset for the current version:

```text
https://github.com/codenogo/dkompos-website/releases/download/v1.5.8/Dkompos_1.5.8_aarch64.dmg
```

Do not commit DMG files into the website repo. Heavy binaries live in GitHub Releases; `index.html` and `releases.html` are updated with the new version, URL, size, and SHA-256 on each cut.

### Cutting a new version

The current version is referenced in many places (hero meta, download URLs,
JSON-LD, footers across pages, README). Bump them all in one step:

```bash
npm run release -- <new-version> --size "38 MB"
```

This rewrites every current-version pointer in `index.html`, `contact.html`,
`privacy.html`, `README.md`, and `package.json`, and refreshes the
`sitemap.xml` `lastmod` dates. It intentionally leaves `releases.html` alone —
that file is the version *history*, so a release means **adding** a new
`release-entry` article (with its own SHA-256, file name, and notes) plus the
matching `SoftwareApplication` entry in its JSON-LD.

### Security headers

`_headers` applies a strict Content-Security-Policy, HSTS, `nosniff`,
`X-Frame-Options: DENY`, a locked-down `Permissions-Policy`, and a referrer
policy on every route. The CSP allows only same-origin assets,
`fonts.bunny.net` for the web fonts, and hash-approved inline JSON-LD blocks for
SEO. `npm run release` refreshes those JSON-LD hashes. If you add a new external
origin (a script, image host, analytics, etc.), update the CSP in `_headers` or
it will be blocked.

### Feedback rate limiting

`functions/api/feedback.js` enforces an optional per-IP rate limit
(5 submissions / 10 minutes) **only** when a KV namespace named
`FEEDBACK_RATE_LIMIT` is bound to the Pages project. With no binding it is a
no-op, so the form keeps working out of the box. To enable it:

```bash
npx wrangler kv namespace create FEEDBACK_RATE_LIMIT
```

then add the binding under **Settings -> Functions -> KV namespace bindings**
with the variable name `FEEDBACK_RATE_LIMIT`.

### Optional: minify CSS

`styles.css` ships unminified and readable; Cloudflare already serves it
Brotli-compressed. If you want a pre-minified file you can generate one on
demand (it is not wired into the pages by default):

```bash
npm run minify:css
```
