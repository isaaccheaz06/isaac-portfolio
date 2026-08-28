# Media manifest

**This file, not the filenames, is the authoritative description of every
asset.**

A filename says where a file goes. It does not say what is in it.
`process-02.webp` could be a kiln, a caliper, or a hand holding a broken rim —
the name is identical either way. Nothing downstream can recover that: not
`media.js`, not the site, not a person picking this up in six months, and not
me. Guessing from a filename produces alt text that is confidently wrong,
which is worse for a screen reader user than no alt text at all.

So the flow is:

```
1. Save the file        assets/<project>/hero.webp
2. Fill in its row      here        <- what it shows, alt text, caption
3. Configure it         /media.js   <- copy the alt and caption across
4. Set Status           here        -> "live"
```

Every row starts at **not uploaded**. Three columns are deliberately blank and
marked `_(fill in)_` — I have not seen these files and will not invent their
contents.

## Filenames here are placeholders until you upload

Image rows show `.webp` because that is the better format to end up in.
**`.jpg` is equally accepted.** When you upload, **edit the Filename cell to
the real filename** — extension included. This table is the record of what
actually exists, so it should say `hero.jpg` if that is what is on disk.

Two rules that matter more than they look:

- **Configure the extension you actually uploaded.** `media.js` uses paths
  verbatim. Nothing rewrites `.jpg` to `.webp`, nothing tries a second
  extension, and there is no fallback if a path 404s. Never write a `.webp`
  path on the assumption that a WebP twin exists.
- **Lowercase, always — stem and extension.** GitHub Pages is case-sensitive;
  Windows is not. `hero.JPG` configured as `hero.jpg` works perfectly on your
  machine and 404s on the live site, which makes it look like a mystery
  instead of a typo. Rename `IMG_4821.JPG` on the way in.

Converting a JPG to WebP saves roughly **25–35%** on photographs. Worth doing,
not urgent — and if you do, make a derivative and keep the original:

```bash
cwebp -q 80 hero.jpg -o hero.webp      # hero.jpg is left untouched
```

Nothing converts, renames, overwrites or deletes a media file without your
approval.

## How to fill in the three blank columns

**What the file actually shows** — for you. Plain description, any length.
"Wide shot of the finished vessel on a dark table, gold repair seam running
top to bottom, shallow depth of field."

**Alt text** — for someone who cannot see it. One sentence, describes content
not the file. No "photo of" or "image of"; a screen reader already says it is
an image. If a screenshot contains readable text that matters, the text *is*
the content — put it in. Use `""` (empty) only when the image is purely
decorative and a caption already carries the meaning.

**Caption** — for everyone, printed under the image. Short, and says something
the picture does not: what stage this is, what went wrong, why it matters.
Leave blank rather than restating the alt text.

## Status values

| Value | Meaning |
|---|---|
| `not uploaded` | File does not exist yet. Starting state for every row. |
| `uploaded` | File is in the folder, not yet configured in `media.js`. Not on the site. |
| `live` | Configured in `media.js` and rendering. |
| `n/a` | Decided against. Keep the row so the decision is recorded. |

---

## Site-wide — `assets/images/`

| Project | Filename | Purpose | What the file actually shows | Alt text | Caption | Status |
|---|---|---|---|---|---|---|
| Site-wide | `isaac-portrait.webp` | About portrait, 4:5, 800×1000 | _(fill in)_ | _(fill in)_ | _(none — portrait takes no caption)_ | not uploaded |
| Site-wide | `isaac-portrait@2x.webp` | Same photograph at 2×, 1600×2000, via `srcset` | _(same photograph as above)_ | _(inherits from 1×)_ | — | not uploaded |

---

## Digital Kintsugi — `assets/digital-kintsugi/`

**Live.** Every file below is a derivative built from
`GatheredContent/` on 2026-08-28 and configured in `media.js`. The sources are
untouched and stay outside this repository.

Video names here are descriptive rather than numbered: this project has five
distinct clips, and `process-06.mp4` would say nothing about which is which.
Photographs keep the `process-NN` sequence.

| Project | Filename | Purpose | What the file actually shows | Alt text | Caption | Status |
|---|---|---|---|---|---|---|
| Digital Kintsugi | `card.webp` | Homepage thumbnail, 1200×900 | 4:3 crop of the front view, framed so the whole vase and its rim stay in shot | The finished blue ribbed ceramic vase, its breaks rejoined with gold seams | *(none — cards take no caption)* | live |
| Digital Kintsugi | `hero.webp` | Lead image, 1200×1600 | The finished vase, front three-quarter, on pale canvas | The finished vase, deep blue with fine printed ridges, its breaks rejoined by branching gold seams | *(none)* | live |
| Digital Kintsugi | `final-loop.mp4` | Final-product loop, 720×1280, 5.7s, `preview` | The repaired vase turning on the same pale ground | The repaired vase turning slowly, gold seams catching the light | *(none)* | live |
| Digital Kintsugi | `final-loop-poster.webp` | Poster for the above | Still of the vase from that clip | *(inherits the clip's alt)* | — | live |
| Digital Kintsugi | `ceramic-printing-loop.mp4` | Clay printing, 540×960, 9.0s, `preview` | Drill-driven clay extruder on a gantry over a fab lab bench | A clay extruder mounted on a gantry printing a small vessel on a fab lab workbench | Ceramic printing and material testing | live |
| Digital Kintsugi | `ceramic-printing-loop-poster.webp` | Poster for the above | Wide shot of the extruder rig and workbench | *(inherits)* | — | live |
| Digital Kintsugi | `process-02.webp` | Extruder detail, 900×1200 | Nozzle laying a clay coil onto a small cylindrical test print | The extruder nozzle laying a coil of clay onto a small cylindrical test print | *(none)* | live |
| Digital Kintsugi | `process-03.webp` | Test print failure, 900×1200 | The same test cylinder, one extrusion slumped away from the wall | The same test print after failure, one extrusion slumped away from the wall | *(none)* | live |
| Digital Kintsugi | `process-01.webp` | First full print, 900×1200 | Unfired printed clay vase on plywood, coil layers visible | An unfired printed clay vase on a plywood board, its coil layers visible | *(none)* | live |
| Digital Kintsugi | `process-04.webp` | Prototype failure, 900×1200 | Hand holding a broken fragment over a painted prototype missing part of its wall, shards on the mat | A hand holding a broken fragment above a painted prototype vessel missing a piece of its wall, shards on the cutting mat | Early prototype and fit testing | live |
| Digital Kintsugi | `process-05.webp` | Insert fit test, 900×1200 | Teal printed wedge held in the gap of a printed prototype | A teal printed insert held in place in the gap of a printed prototype vessel | *(none)* | live |
| Digital Kintsugi | `scanning-loop.mp4` | 3D scanning, 540×960, 16.6s, `preview` | Handheld scanner passing over the fractured vessel, capture building on the monitor behind | A handheld 3D scanner passing over the fractured vessel, projected light on the table and the capture building on screen | Scanning the fractured form | live |
| Digital Kintsugi | `scanning-loop-poster.webp` | Poster for the above | Still of the scanner over the vessel | *(inherits)* | — | live |
| Digital Kintsugi | `scan-result-loop.mp4` | Raw scan, 540×960, 8.0s, `preview` | Scan mesh on screen — vessel wall plus a large flat artefact | The raw scan mesh on screen, the vessel wall captured alongside a large flat artefact | *(none)* | live |
| Digital Kintsugi | `scan-result-loop-poster.webp` | Poster for the above | Still of the mesh on the monitor | *(inherits)* | — | live |
| Digital Kintsugi | `rhino-fit-loop.mp4` | Rhino fitting, 540×960, 12.3s, `preview` | Scanned mesh in Rhino with a wireframe replacement component at the break | The scanned mesh open in Rhino with a wireframe replacement component positioned against the break | Reconstructing the replacement component in Rhino | live |
| Digital Kintsugi | `rhino-fit-loop-poster.webp` | Poster for the above | Still of the Rhino viewport | *(inherits)* | — | live |
| Digital Kintsugi | `gold-repair.mp4` | Gold repair, 720×1280, 34.6s, **`player`** | Gold pigment mixed into epoxy and worked into the breaks | Mixing gold pigment into epoxy and working it into the breaks of the vessel | Final assembly and gold repair | live |
| Digital Kintsugi | `gold-repair-poster.webp` | Poster for the above | Gold epoxy being mixed on card, teal printed ring on the bench | *(inherits)* | — | live |
| Digital Kintsugi | `final-01.webp` | Closing detail, 1050×1400 | The finished vase from the side, gold seams through a mottled green glaze patch | The finished vase from the side, gold seams running down through a mottled green patch of glaze | *(none)* | live |

### Held back

| Source | Why |
|---|---|
| `pre-kiln-vessels-original.jpg` | Distinct stage, but the page already runs 13 assets. One line in `media.js` if you want it. |
| `digital-kintsugi-full-film-original.mov` | 157MB, 3m36s. Smallest watchable encode ≈19MB — twice the rest of the page. Recommended for external hosting; the page markup is ready and commented. |
| `05-cad-source/*.3dm` | CAD source, 30MB combined, not web media. Never deployed. |

---

## LLM-Powered Museum NPC — `assets/museum-npc/`

No video required for this project yet.

| Project | Filename | Purpose | What the file actually shows | Alt text | Caption | Status |
|---|---|---|---|---|---|---|
| Museum NPC | `card.webp` | Homepage thumbnail | _(fill in)_ | _(fill in)_ | _(none — cards take no caption)_ | not uploaded |
| Museum NPC | `hero.webp` | Lead visual — fullscreen game-view capture | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Museum NPC | `unity-editor-01.webp` | Unity editor screenshot 1 | _(fill in — name the panel that matters)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Museum NPC | `unity-editor-02.webp` | Unity editor screenshot 2 | _(fill in — name the panel that matters)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Museum NPC | `game-view-01.webp` | Game-view screenshot 1 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Museum NPC | `game-view-02.webp` | Game-view screenshot 2 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Museum NPC | `conversation-01.webp` | NPC conversation screenshot 1 | _(fill in — transcribe the visible dialogue)_ | _(fill in — the dialogue text is the content)_ | _(fill in, optional)_ | not uploaded |
| Museum NPC | `conversation-02.webp` | NPC conversation screenshot 2 | _(fill in — transcribe the visible dialogue)_ | _(fill in — the dialogue text is the content)_ | _(fill in, optional)_ | not uploaded |

---

## Suzume-Inspired CNC Stool — `assets/suzume-cnc-stool/`

| Project | Filename | Purpose | What the file actually shows | Alt text | Caption | Status |
|---|---|---|---|---|---|---|
| Suzume CNC Stool | `card.webp` | Homepage thumbnail | _(fill in)_ | _(fill in)_ | _(none — cards take no caption)_ | not uploaded |
| Suzume CNC Stool | `card-loop.mp4` | Optional muted homepage loop, `mode: 'preview'` | _(fill in)_ | _(fill in)_ | _(none)_ | not uploaded |
| Suzume CNC Stool | `hero.webp` | Lead visual — finished stool | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `cad-01.webp` | Model / toolpath view 1 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `cad-02.webp` | Model / toolpath view 2 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `process-01.webp` | Fabrication, chronological 1 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `process-02.webp` | Fabrication, chronological 2 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `process-03.webp` | Fabrication, chronological 3 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `process-04.webp` | Fabrication, chronological 4 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `final-01.webp` | Completed stool 1 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `final-02.webp` | Completed stool 2 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `process-film.mp4` | Full process film, `mode: 'player'` | _(fill in)_ | _(fill in — used as the player's accessible name)_ | _(fill in, optional)_ | not uploaded |
| Suzume CNC Stool | `process-film-poster.webp` | Still shown before the film plays | _(fill in)_ | _(inherits the film's alt)_ | — | not uploaded |

---

## Parametric Butterfly Pavilion — `assets/butterfly-pavilion/`

| Project | Filename | Purpose | What the file actually shows | Alt text | Caption | Status |
|---|---|---|---|---|---|---|
| Butterfly Pavilion | `card.webp` | Homepage thumbnail | _(fill in)_ | _(fill in)_ | _(none — cards take no caption)_ | not uploaded |
| Butterfly Pavilion | `card-loop.mp4` | Optional muted homepage loop, `mode: 'preview'` | _(fill in)_ | _(fill in)_ | _(none)_ | not uploaded |
| Butterfly Pavilion | `hero.webp` | Lead visual — finished model | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `cad-01.webp` | Rhino / Grasshopper view 1 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `cad-02.webp` | Rhino / Grasshopper view 2 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `cad-03.webp` | Rhino / Grasshopper view 3 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `process-01.webp` | Physical process, chronological 1 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `process-02.webp` | Physical process, chronological 2 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `process-03.webp` | Physical process, chronological 3 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `final-01.webp` | Completed model 1 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `final-02.webp` | Completed model 2 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `process-film.mp4` | Full process film, `mode: 'player'` | _(fill in)_ | _(fill in — used as the player's accessible name)_ | _(fill in, optional)_ | not uploaded |
| Butterfly Pavilion | `process-film-poster.webp` | Still shown before the film plays | _(fill in)_ | _(inherits the film's alt)_ | — | not uploaded |

---

## Blender animation — `assets/future/blender-animation/` — NOT WIRED IN

Staging only. This is a future supporting project, absent from the homepage,
the navigation, the project pages and `media.js`. Rows are here so the
convention is recorded; `Status` cannot reach `live` until it is given a place
on the site.

| Project | Filename | Purpose | What the file actually shows | Alt text | Caption | Status |
|---|---|---|---|---|---|---|
| Blender animation | `full-animation.mp4` | The complete animation, `mode: 'player'` | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Blender animation | `full-animation-poster.webp` | Still shown before the animation plays | _(fill in)_ | _(inherits the animation's alt)_ | — | not uploaded |
| Blender animation | `teaser-loop.mp4` | Short muted loop, `mode: 'preview'` | _(fill in)_ | _(fill in)_ | _(none)_ | not uploaded |
| Blender animation | `still-01.webp` | Rendered still 1 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Blender animation | `still-02.webp` | Rendered still 2 | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Blender animation | `viewport-01.webp` | Blender viewport / workspace screenshot | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |
| Blender animation | `materials-lighting-01.webp` | Materials and lighting setup | _(fill in)_ | _(fill in)_ | _(fill in, optional)_ | not uploaded |

---

## Notes

- **No file is required.** Absent files are simply not configured. The site
  renders cleanly with none of them present, which is its state right now.
- **Rows are suggestions, not a quota.** Four strong process photographs beat
  eight weak ones. Mark the rest `n/a` rather than filling the list.
- **Need a fifth `process-05`?** Add the row. The numbering is a convention,
  not a limit.
- **A poster is required for any video you configure in `player` mode.**
  Without one the player is a black rectangle until it is pressed.
