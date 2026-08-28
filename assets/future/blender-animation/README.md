# Blender animation — staging only

**Not wired into the site.** This is a future supporting project, not a fifth
featured project. It is deliberately absent from the homepage, the navigation,
the project pages and `/media.js`.

This folder exists so you have somewhere consistent to put the files as they
come out of Blender. Nothing here renders anywhere, and adding a file will not
change the site.

## Suggested filenames

| Filename | Purpose |
|---|---|
| `full-animation.mp4` | The complete animation. Plays with controls, audio allowed. |
| `full-animation-poster.webp` | Still shown before the animation plays. |
| `teaser-loop.mp4` | Short muted loop — 6–10s, no audio track. |
| `still-01.webp` | Rendered still. |
| `still-02.webp` | Rendered still. |
| `viewport-01.webp` | Blender viewport / workspace screenshot. |
| `materials-lighting-01.webp` | Materials and lighting setup. |

Same convention as everywhere else: lowercase kebab-case, two-digit sequence
numbers, and no file is required.

## When you want to publish it

This is a deliberate decision, not a mechanical step — say the word and it
gets done properly rather than half-wired:

1. Decide **what it is**: a fifth featured card, an entry under one of the
   three discipline pages, or a section inside an existing project page. The
   homepage is built around four cards, so a fifth is a composition change,
   not just a config entry.
2. Add a `future/blender-animation` block to `/media.js`.
3. `full-animation.mp4` gets `mode: 'player'`; `teaser-loop.mp4` gets
   `mode: 'preview'`.
4. Add its rows to `../../MEDIA-MANIFEST.md`.

Until then this folder is inert, which is the point — you can upload as you
render without anything appearing on the live site half-finished.

## Sizes

WebP at quality ~80 for stills. MP4 as H.264 + AAC for video. Rendered
animation compresses badly at low bitrates — check a still frame at 100% before
committing to a setting. Keep your `.blend` files and full-quality renders
outside this repository; it is not a backup.

Full guidance: `../../README.md`.
