# LLM-Powered Museum NPC — media

Tools on the project page: Unity · Ollama · Local LLMs

Files here are only shown once they are also configured in `/media.js`.
Describe each one in `../MEDIA-MANIFEST.md` first — that is where the alt text
comes from.

## What this project wants

- A **homepage card**
- A **fullscreen hero screenshot**
- **Unity editor screenshots** — the scene, the NPC rig, the wiring
- **Game-view screenshots** — what a visitor actually sees
- **NPC conversation screenshots** — the dialogue in progress
- The **external development-log link** (already configured, see below)
- **No video required yet.** Screenshots carry this one for now.

## Accepted filenames

| Filename | Purpose | Required? |
|---|---|---|
| `card.webp` / `.jpg` | Homepage thumbnail. Landscape, ~1200×900. | Recommended |
| `hero.webp` / `.jpg` | Lead visual — a fullscreen game-view capture. ~1600×900. | Recommended |
| `unity-editor-01.webp` / `.jpg` … | Unity editor screenshots. | Optional |
| `game-view-01.webp` / `.jpg` … | Fullscreen / game-view screenshots. | Optional |
| `conversation-01.webp` / `.jpg` … | NPC conversation screenshots. | Optional |

Two-digit numbers, in sequence, no gaps.

## Screenshot notes

- Capture at a **16:9 window** so the shots sit together without odd crops.
- Editor screenshots are dense. Say in the manifest which panel matters —
  "the NavMesh bake settings", not "Unity editor" — so the caption can point
  at the thing worth seeing.
- Conversation screenshots contain readable text. That text belongs in the
  **alt text**, because it is the content: a screen reader user gets nothing
  from "a conversation window".

## External links

Already live on the project page. They are written in the page's own markup —
`projects/museum-npc.html`, the `<ul class="project-links">` block — **not** in
`media.js`, because a link is content and has to work with JavaScript off.

- View development log → `https://isaaccheaz.itch.io/museum/devlog`
- View project on itch.io → `https://isaaccheaz.itch.io/museum`

Both open in a new tab with `rel="noopener noreferrer"`, carry a visible ↗, and
tell a screen reader they open externally. To add a third, copy one `<li>`.

The page stays a visual case study in its own right. It does **not** redirect
to itch.io, and there is no playable build embedded yet.

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

WebP or JPG at quality ~80. Put the real pixel dimensions into `media.js` as `width`
and `height`. Keep your originals somewhere outside this repository.

Full guidance: `../README.md`.
