# Dkompos Website

Static marketing site for `www.dkompos.com`.

Pure HTML / CSS / SVG / PNG. No build step, no JS.

## Local Preview

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Homepage |
| `releases.html` | Release notes |
| `privacy.html` | Privacy stance |
| `styles.css` | All styling, single token system |
| `robots.txt` / `sitemap.xml` | Search-engine plumbing |
| `assets/brand/` | Brand mark and wordmark SVGs |
| `assets/screens/` | Product screenshots |

## Fonts

Inter + JetBrains Mono via [Bunny Fonts](https://fonts.bunny.net) (privacy-friendly Google Fonts mirror — no cookies, no tracking).

## Deploy

The site is intended to deploy as a static directory to any host (Cloudflare Pages, GitHub Pages, Netlify, Vercel, S3+CloudFront). The publish directory is the repo root.

## Distribution Note

Replace the early-access `mailto:` in `index.html` with the notarised DMG URL once the Developer ID signing pipeline is live.
