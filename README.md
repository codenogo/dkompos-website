# Dkompos

**Audiophile-first music player, DJ workspace, and library for macOS.**

**[Download for macOS →](https://www.dkompos.com/)** &nbsp;·&nbsp; [Release notes](https://www.dkompos.com/releases.html) &nbsp;·&nbsp; [Privacy](https://www.dkompos.com/privacy.html)

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
| **OS** | macOS 11 or newer |
| **CPU** | Apple Silicon (M1 and later) |
| **Distribution** | Signed Developer ID, Apple-notarised, stapled DMG |
| **Current version** | 1.5.4 |

The latest DMG, SHA-256 checksum, and full release notes are at **[dkompos.com/releases.html](https://www.dkompos.com/releases.html)**.

---

## About this repository

This repo hosts the **dkompos.com marketing site** and the public **Release DMGs** for the Dkompos macOS app.

The site itself is pure HTML / CSS / SVG / PNG. No JS, no build step.

### Local preview

```bash
python3 -m http.server 8080
```

Then open <http://127.0.0.1:8080>.

### Layout

| Path | Purpose |
|---|---|
| `index.html` | Home |
| `releases.html` | Release notes for every published build |
| `privacy.html` | Privacy stance |
| `styles.css` | All styling, single token system |
| `robots.txt` / `sitemap.xml` | Search-engine plumbing |
| `assets/brand/` | Brand mark and wordmark SVGs |
| `assets/screens/` | Product screenshots |

### Fonts

Inter + JetBrains Mono via [Bunny Fonts](https://fonts.bunny.net) — a privacy-friendly Google Fonts mirror, no cookies, no tracking.

### Deploy

Deploys as a static directory to any host (Cloudflare Pages, GitHub Pages, Netlify, Vercel, S3+CloudFront). The publish directory is the repo root.

### Distribution

The public Download CTA points at the notarised GitHub Release asset for the current version:

```text
https://github.com/codenogo/dkompos-website/releases/download/v1.5.4/Dkompos_1.5.4_aarch64.dmg
```

Do not commit DMG files into the website repo. Heavy binaries live in GitHub Releases; `index.html` and `releases.html` are updated with the new version, URL, size, and SHA-256 on each cut.
