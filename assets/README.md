# assets

Every photograph, render and video the site can show. One folder per project,
plus `images/` for anything site-wide.

```
assets/
├── MEDIA-MANIFEST.md          <- the authoritative description of every file
├── images/                    <- site-wide (the About portrait)
├── digital-kintsugi/
├── museum-npc/
├── suzume-cnc-stool/
├── butterfly-pavilion/
└── future/
    └── blender-animation/     <- staging only; not wired into the site
```

## The two-step rule

Dropping a file in a folder does **not** put it on the site. Nothing renders
until it is also configured in `/media.js`. That is deliberate — it is what
lets you upload in any order, leave gaps, and never have a half-finished
folder show up as an empty box on a live page.

```
1. Save the file        assets/<project>/hero.webp
2. Describe it          assets/MEDIA-MANIFEST.md   (what it shows, alt, caption)
3. Configure it         /media.js
```

Step 2 is not optional busywork. `media.js` needs real alt text, and alt text
cannot be written from a filename — `process-02.webp` says nothing about what
is in the frame. The manifest is where that knowledge lives.

## Filename convention

Lowercase, kebab-case, two-digit sequence numbers (`01`, not `1`).

**The stem is the convention. The extension is whatever you actually
uploaded.** Tables below show `.webp` because that is the better format to
end up in, but `.jpg` is equally accepted everywhere an image is listed.

| Filename | Purpose |
|---|---|
| `card.webp` / `card.jpg` | Optimized homepage thumbnail / poster |
| `card-loop.mp4` | Optional short muted homepage loop |
| `hero.webp` / `hero.jpg` | Lead visual on the project page |
| `cad-01.webp` / `.jpg` | CAD / model progression, in order |
| `process-01.webp` / `.jpg` | Process media, chronological |
| `final-01.webp` / `.jpg` | Completed-result media |
| `process-film.mp4` | Full start-to-finish project video |
| `process-film-poster.webp` / `.jpg` | Still shown before the full video plays |
| `unity-editor-01.webp` / `.jpg` | Unity editor screenshot |
| `game-view-01.webp` / `.jpg` | Fullscreen / game-view screenshot |
| `conversation-01.webp` / `.jpg` | NPC conversation screenshot |

**No filename is required.** Absent files are simply not configured, and the
site renders cleanly with none of them present — which is its state today.

## JPG and WebP

Both work. Upload whichever you have.

- **Configure the extension you actually uploaded.** `media.js` uses the path
  verbatim — nothing anywhere rewrites `.jpg` to `.webp` or tries a second
  extension if the first 404s. If the file is `hero.jpg`, the config says
  `hero.jpg`.
- **Never assume a WebP twin exists.** There is no fallback chain and no
  automatic conversion, here or in the build (there is no build). A `.webp`
  path with only a `.jpg` on disk is a broken image, full stop.
- **Name new JPGs in lowercase**: `hero.jpg`, never `Hero.JPG` or `hero.JPEG`.
  Cameras and phones love `IMG_4821.JPG`; rename on the way in.

### Case sensitivity — the one that will actually bite you

GitHub Pages serves from a **case-sensitive** filesystem. Windows does not.

So `hero.JPG` on disk configured as `hero.jpg` works perfectly on your
machine, passes every local check, and then 404s on the live site. It is the
single most common way this kind of setup breaks, and it always looks like a
mystery because local testing says it is fine.

Lowercase everything — stem and extension — and the problem cannot occur.

### Should you convert to WebP?

Worth doing, not urgent. At matched visual quality WebP typically lands
**25–35% smaller than JPEG** on photographs; expect the low end on noisy
workshop shots and the high end on renders and screenshots with flat areas.
On a page carrying six process photographs that is roughly a third off the
image payload.

If you want that, convert to a **derivative** and keep the JPG:

```bash
# writes hero.webp, leaves hero.jpg untouched
cwebp -q 80 hero.jpg -o hero.webp
```

Then point `media.js` at the `.webp`. Keep the `.jpg` — it costs nothing once
it is no longer referenced, and it is your fallback if a crop looks wrong.

**I will not convert, rename, overwrite or delete any media file without
asking you first.** That applies to originals and derivatives alike.

## Formats and sizes

- **Photographs and renders → WebP.** Quality ~80 is usually indistinguishable
  from the original at a fraction of the size.
- **Video → MP4 (H.264 + AAC).** It is the one codec every browser plays.
  WebM/VP9 is worth adding only for a file large enough that a second encode
  pays for itself; `media.js` takes both through `sources`.
- **Homepage loops: 6–10 seconds, no audio track at all.** Not a muted audio
  track — no track. Browsers block autoplay on anything carrying audio, and a
  stripped track is smaller.
- **Full films load only when asked.** Player-mode video uses
  `preload="metadata"`, so nothing but the header downloads until play is
  pressed.
- **Compress copies, never originals.** Keep archival masters outside this
  repository — an external drive or cloud folder. Everything in here is a
  derivative sized for the web, and the repo is not a backup.
- **Record real pixel dimensions.** `width` and `height` in `media.js` are
  what reserve the correct box before a file arrives, and are what stop the
  page jumping as it loads.

## Where each thing goes

| What | Folder |
|---|---|
| About portrait | `images/` |
| The four featured projects | `<project-slug>/` |
| Blender animation (future) | `future/blender-animation/` |

See each folder's own README for what that project specifically needs, and
`MEDIA-MANIFEST.md` for the full row-by-row list.
