# Digital Kintsugi — media

Tools on the project page: Rhino · 3D Scanning · Ceramic 3D Printing · FDM 3D Printing

**This project is live.** All 20 files here are web derivatives built from
`GatheredContent/` and configured in `/media.js`. Row-by-row descriptions and
alt text are in `../MEDIA-MANIFEST.md`.

## Where these came from

```
OneDrive\Documents\School\2nd Year\Digital Fabrication\
  Project 1 - Kintsugi\GatheredContent\
```

That folder is the archive and is **read-only**: nothing in it was moved,
renamed, edited or deleted, and none of it is committed. Everything here is a
derivative. 38MB of photographs became 1.4MB, and 85MB of footage became 9.1MB.

## What is here

### Images — 1.4 MB total

| File | Size | From | Role |
|---|---|---|---|
| `card.webp` | 1200×900 | `final-vase-front` | Homepage thumbnail, cropped to 4:3 |
| `hero.webp` | 1200×1600 | `final-vase-front` | Lead image, uncropped 3:4 |
| `final-01.webp` | 1050×1400 | `final-vase-repair-side` | Closing detail |
| `process-01.webp` | 900×1200 | `first-ceramic-print` | First full clay print |
| `process-02.webp` | 900×1200 | `ceramic-printer-in-action` | Extruder laying a coil |
| `process-03.webp` | 900×1200 | `ceramic-test-print-failure` | Failed test print |
| `process-04.webp` | 900×1200 | `prototype-failure` | Broken prototype |
| `process-05.webp` | 900×1200 | `prototype-insert-fit` | Insert fit test |

Plus one `*-poster.webp` per clip, pulled from a representative frame.

### Video — 9.1 MB total, H.264, **no audio track at all**

| File | Size | Length | Mode |
|---|---|---|---|
| `final-loop.mp4` | 720×1280 | 5.7s | `preview` |
| `ceramic-printing-loop.mp4` | 540×960 | 9.0s | `preview` |
| `scanning-loop.mp4` | 540×960 | 16.6s | `preview` |
| `scan-result-loop.mp4` | 540×960 | 8.0s | `preview` |
| `rhino-fit-loop.mp4` | 540×960 | 12.3s | `preview` |
| `gold-repair.mp4` | 720×1280 | 34.6s | **`player`** |

Gallery clips are 540 wide because the cell is ~350 CSS px; the two featured
ones keep 720. Audio was stripped with `-an` rather than muted — a track at all
can block autoplay, and these were silent to begin with.

## Naming

Photographs follow the site convention (`process-NN`). **Video does not**: five
distinct clips called `process-06.mp4` through `process-10.mp4` would tell you
nothing about which is which, so they are named for what they show. The
manifest records the mapping.

## Everything is upright

Photographs are 3:4, clips are 9:16 — every source is portrait, straight off a
phone. Two consequences, both handled and neither needing attention when you
add more:

- `script.js` tags anything taller than it is wide with `.is-portrait`, and
  `project.css` caps the lead image at 560px wide / 78vh so one photograph does
  not become two screens of scrolling.
- Gallery cells are given a uniform 3:4 box with a centred CSS crop, so rows
  line up instead of trailing gaps under the shorter items. The files keep
  their true dimensions; the crop is display-only and is one CSS rule to change.

## Not deployed

| Source | Why |
|---|---|
| `pre-kiln-vessels-original.jpg` | Distinct stage, but the page already carries 13 assets. One entry in `media.js` if you want it. |
| `digital-kintsugi-full-film-original.mov` | 157MB, 3m36s. See below. |
| `05-cad-source/*.3dm` | 30MB of Rhino source. Not web media, never deployed. |

### The full film

Not on the site. Measured encodes of the real file:

| Setting | Full 3m36s |
|---|---|
| 540p CRF30 | ~19 MB |
| 720p CRF28 | ~37 MB |
| 720p CRF26 | ~48 MB |

Even the smallest is twice the weight of everything else on the page, and git
would keep every version of it forever. **Host it externally** — YouTube or
Vimeo unlisted, or itch.io beside the Museum project — and uncomment the link
block already waiting in `projects/digital-kintsugi.html`.

## Rebuilding

The scripts that produced these live in the session scratchpad, not the repo.
They only ever read from `GatheredContent` and write here. To redo a clip:

```bash
ffmpeg -i "<source>.mp4" -vf "scale=540:-2,fps=24" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 29 \
  -preset slower -movflags +faststart -an out.mp4
```

Full guidance: `../README.md`.
