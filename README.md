# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kawaka9099-hash/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kawaka9099-hash/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your photos and a caption into a multi-panel
poster cover in the style of GTA 6's posters — bold caption lettering, a Vice
City sunset or neon colour grade — and exports it as a PNG to share.

Built for the make.fun bounty
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo:** load photos from your machine into any of the poster's
  panels. One photo can fill every panel, or each panel can hold a different
  photo. Photos are read locally with FileReader and never uploaded.
- **Crop and position:** click a panel in the preview to select it, then zoom
  and pan that photo until the crop sits right.
- **Three poster layouts:** Vice Trio (three vertical panels), Hero + Duo
  (one big panel over two small ones), and Four Corners (a 2 × 2 grid).
- **Three colour grades:** Sunset, Neon Nights, and Palm Dusk — each washes
  the panels and tints the caption lettering.
- **Caption:** a big bold main caption and a smaller sub-caption, both
  editable, drawn with gradient lettering, a dark outline and a neon glow.
- **Post sizes:** 1080 × 1080, 1080 × 1350, and 1920 × 1080, exported as PNG
  with one click.

## Run it

Serve `app/` with any static file server and open `index.html` in desktop
Chrome. No build step, no network requests: every script, style and sample
image is a file under `app/`.

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

## Original art only

Everything in this studio is original: the sample photos
(`app/samples/*.jpg`) were drawn by code for this project, the palm
silhouettes and sun are canvas paths, and the lettering uses system fonts.
No Rockstar Games logo, wordmark, official artwork, character or font is
used, and the app is not affiliated with Rockstar Games.

## Hand in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored make.fun
library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
