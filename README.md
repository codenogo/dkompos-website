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

## Distribution

The public download CTA points at the notarised GitHub Release asset:

```text
https://github.com/codenogo/dkompos-website/releases/download/v1.5.3/Dkompos_1.5.3_aarch64.dmg
```

Do not commit DMG files into this website repo. Keep heavy binaries in GitHub
Releases or object storage, then update `index.html` and `releases.html` with
the new version, URL, size, and SHA-256.
