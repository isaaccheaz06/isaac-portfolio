# Suzume-Inspired CNC Stool — media

Tools on the project page: Rhino · Carbide Create · CNC Machining

Files here are only shown once they are also configured in `/media.js`.
Describe each one in `../MEDIA-MANIFEST.md` first — that is where the alt text
comes from.

## What this project wants

- A **homepage card**
- A **finished-stool hero**
- **Chronological prototyping and fabrication photographs** — stock, toolpaths,
  cutting, test fits, assembly, in the order it happened
- **Final-result photographs** of the completed stool
- The **complete process film**

## Accepted filenames

| Filename | Purpose | Required? |
|---|---|---|
| `card.webp` / `.jpg` | Homepage thumbnail. Landscape, ~1200×900. | Recommended |
| `card-loop.mp4` | Optional 6–10s muted loop in place of the still. Needs the card still as its poster. | Optional |
| `hero.webp` / `.jpg` | Lead visual — the finished stool. ~1600×900 or wider. | Recommended |
| `cad-01.webp` / `.jpg` … | Rhino / Carbide Create model and toolpath views. | Optional |
| `process-01.webp` / `.jpg` … | Prototyping and fabrication, chronological. | Optional |
| `final-01.webp` / `.jpg` … | Completed-stool photographs beyond the hero. | Optional |
| `process-film.mp4` | Full start-to-finish film. Plays with controls, audio allowed. | Optional |
| `process-film-poster.webp` / `.jpg` | Still shown before that film plays. | Required *if* `process-film.mp4` exists |

Two-digit numbers, in sequence, no gaps: `process-01`, `process-02`, `process-03`.

## Notes

- Chronology is the argument on this one. Number `process-NN` in the order the
  work actually happened, and the gallery will read as a sequence without any
  extra configuration — `media.js` renders the array in the order you list it.
- The CNC footage is the obvious candidate for `card-loop.mp4`. Strip the audio
  track entirely; a router is loud and the loop must be silent to autoplay.
- `process-film.mp4` is `mode: 'player'` — controls, no autoplay, audio
  permitted. Do not configure a full film as a decorative loop.

## Extensions: `.jpg` is fine

The stem is the convention; the extension is whatever you actually uploaded.
Every `.webp` in the table above may equally be `.jpg`.

- Configure the **real** extension in `media.js`. Nothing rewrites `.jpg` to
  `.webp`, and there is no fallback if a path 404s.
- Name new JPGs lowercase: `hero.jpg`, not `Hero.JPG`. GitHub Pages is
  case-sensitive and Windows is not, so a wrong-case name works locally and
  breaks live.
- Converting to WebP saves roughly **25-35%** on photographs. If you do,
  produce a derivative (`cwebp -q 80 hero.jpg -o hero.webp`) and keep the JPG.
  No file gets converted, renamed or deleted without your say-so.

## Sizes

WebP or JPG at quality ~80. MP4 as H.264 + AAC. Put the real pixel dimensions into
`media.js` as `width` and `height` — they are what stop the page jumping while
the file loads. Keep your originals somewhere outside this repository.

Full guidance: `../README.md`.
