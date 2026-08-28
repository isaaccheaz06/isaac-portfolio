# assets/images

Site-wide images that do not belong to a single project.

## isaac-portrait.webp

The About section portrait. Save it here, then fill in the `portrait`
block in `/media.js` — the worked example there lists every field.

- 4:5 upright crop
- ~800 x 1000 for the 1x file; optionally `isaac-portrait@2x.webp` at 1600 x 2000
- WebP, quality ~80

Nothing renders until `media.js` points at the file, so an empty folder
here is a valid state, not a missing asset.

Per-project media lives in `assets/<project-slug>/` instead.
