# assets/images — site-wide

Images that do not belong to a single project. Today that is the About
portrait and nothing else; per-project media lives in `assets/<project-slug>/`.

Files here are only shown once they are also configured in `/media.js`.
Describe each one in `../MEDIA-MANIFEST.md` first — that is where the alt text
comes from.

## Accepted filenames

| Filename | Purpose | Required? |
|---|---|---|
| `isaac-portrait.webp` | The About section portrait. | Optional |
| `isaac-portrait@2x.webp` | Same photograph at 2× for retina, via `srcset`. | Optional |

## isaac-portrait.webp

- **4:5 upright**, you in a fabrication, prototyping or technical workspace.
  The About layout is built around that shape.
- **800 × 1000** for the 1× file; **1600 × 2000** for the optional `@2x`.
  The column is about 320px at its widest, so it never needs to be larger.
- WebP at quality ~80.

Then fill in the `portrait` block in `/media.js` — the worked example there
lists every field.

**The alt text is yours to write.** `media.js` carries a placeholder marked
`>>> CONFIRM THIS ONCE YOU HAVE PICKED THE PHOTOGRAPH <<<`. It describes
nothing, because nobody has seen the photograph yet. Replace it before this
goes live; do not ship the draft.

While no portrait is configured the About section renders as its two-column
layout with no gap reserved and no placeholder drawn. An empty folder here is
a valid state, not a missing asset.

Full guidance: `../README.md`.
