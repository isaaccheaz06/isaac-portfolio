# Butterfly Pavilion — media

Tools on the project page: Rhino · Grasshopper · Laser Cutting

Files here are only shown once they are also configured in `/media.js`.
Describe each one in `../MEDIA-MANIFEST.md` first — that is where the alt text
comes from.

## What this project wants

- A **homepage card**
- A **finished-model hero**
- **CAD / Grasshopper views** — the definition and the geometry it produces
- **Physical process photographs** — cutting, sorting, assembling
- **Final-result photographs** of the completed model
- The **complete process film**

## Accepted filenames

| Filename | Purpose | Required? |
|---|---|---|
| `card.webp` / `.jpg` | Homepage thumbnail. Landscape, ~1200×900. | Recommended |
| `card-loop.mp4` | Optional 6–10s muted loop in place of the still. Needs the card still as its poster. | Optional |
| `hero.webp` / `.jpg` | Lead visual — the finished model. ~1600×900 or wider. | Recommended |
| `cad-01.webp` / `.jpg` … | Rhino geometry and Grasshopper definition views. | Optional |
| `process-01.webp` / `.jpg` … | Laser cutting and physical assembly, chronological. | Optional |
| `final-01.webp` / `.jpg` … | Completed-model photographs beyond the hero. | Optional |
| `process-film.mp4` | Full start-to-finish film. Plays with controls, audio allowed. | Optional |
| `process-film-poster.webp` / `.jpg` | Still shown before that film plays. | Required *if* `process-film.mp4` exists |

Two-digit numbers, in sequence, no gaps: `cad-01`, `cad-02`, `cad-03`.

## Notes

- A Grasshopper canvas screenshot is unreadable at gallery width. Either crop
  to the cluster worth showing, or mark it `span: 'full'` in `media.js` so it
  runs the whole measure. Say which in the manifest.
- Keep `cad-NN` for screen output and `process-NN` for photographs of the
  physical build. Mixing them makes the sequence hard to follow.
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
