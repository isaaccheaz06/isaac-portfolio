/* ============================================================================
 * SITE MEDIA CONFIG — the one file to edit when you add photos or video.
 * ============================================================================
 *
 * Nothing here yet, so no image or video area renders anywhere on the site.
 * That is deliberate: an empty slot is worse than no slot, so the cards and
 * project pages are designed to look finished with type alone. The moment you
 * fill an entry in, the markup for it appears.
 *
 * HOW TO ADD SOMETHING
 *   1. Drop the file in assets/<project-slug>/
 *   2. Replace the matching `null` or empty [] below with a media object
 *   3. Reload. Nothing else to wire up.
 *
 * PATHS are always written from the site root ("assets/..."), never with
 * "../". script.js resolves them against this file's own URL, so the same
 * string works on the home page, inside /projects/, and under the
 * /isaac-portfolio/ prefix on GitHub Pages.
 *
 * ---------------------------------------------------------------------------
 * MEDIA OBJECT
 * ---------------------------------------------------------------------------
 *   {
 *     type:    'image' | 'video'      required
 *     src:     'assets/slug/hero.webp'    required
 *     alt:     'What the picture shows'   required for images; describe the
 *                                         content, not the file. Use '' only
 *                                         if the image is purely decorative.
 *     width:   1600                   pixel width of the file
 *     height:  900                    pixel height of the file
 *                                     width/height let the browser reserve the
 *                                     right box before the file downloads,
 *                                     which is what stops the page jumping.
 *
 *     poster:  'assets/slug/demo-poster.webp'   video only, strongly advised.
 *                                     Shown before playback, and shown INSTEAD
 *                                     of the video for visitors who have asked
 *                                     for reduced motion.
 *     sources: [                      video only, optional. Offer .webm first
 *       { src: 'assets/slug/demo.webm', type: 'video/webm' },
 *       { src: 'assets/slug/demo.mp4',  type: 'video/mp4'  }
 *     ]                               and the browser takes the smaller one it
 *                                     understands. If you only have one file,
 *                                     skip this and use `src`.
 *
 *     srcset:  [                      images only, optional. Same file at
 *       { src: 'assets/slug/hero.webp',    descriptor: '800w'  },
 *       { src: 'assets/slug/hero@2x.webp', descriptor: '1600w' }
 *     ]                               several sizes; the browser picks one.
 *     sizes:   '(max-width: 900px) 320px, 30vw'
 *                                     How wide the image will actually be
 *                                     rendered. Only meaningful with srcset,
 *                                     and only worth adding if you have more
 *                                     than one file — `src` alone is fine.
 *
 *     caption: 'Short caption'        gallery items only, optional
 *     span:    'full' | 'half'        gallery items only. 'full' runs the whole
 *                                     measure; 'half' pairs up beside its
 *                                     neighbour. Defaults to 'half'.
 *     ratio:   '16 / 9'               optional. Any CSS aspect-ratio value.
 *                                     Only needed when you want to crop to a
 *                                     shape other than the file's own.
 *   }
 *
 * Videos always render muted, looped and playsinline, pause themselves when
 * scrolled out of view or when the tab is hidden, and are replaced by their
 * poster under prefers-reduced-motion. You do not need to configure any of it.
 * ========================================================================= */

window.SITE_MEDIA = {

    /* ---------------------------------------------------------------------
     * ABOUT PORTRAIT
     * The single photograph of you in the About section. Images only.
     *
     * WHERE THE FILE GOES
     *   assets/images/isaac-portrait.webp
     *
     * WHAT TO SHOOT / CROP
     *   4:5 upright, you in a fabrication, prototyping or technical space.
     *   The layout is built around that shape. A different ratio still works
     *   — set `ratio` below and it is used verbatim — but 4:5 is what the
     *   three-column composition was sized for.
     *
     * WHAT SIZE TO EXPORT
     *   The portrait column is about 300px wide on a 1440px screen and 320px
     *   at its widest on a phone, so it never needs to be large:
     *     isaac-portrait.webp        800 x 1000   the one you must have
     *     isaac-portrait@2x.webp    1600 x 2000   optional, for retina
     *   `width` and `height` below must be the real pixel dimensions of the
     *   1x file. They are what stop the page jumping while it downloads.
     *
     * While this stays null the About section renders as the two-column
     * layout you already have. No gap is reserved, no placeholder is drawn.
     *
     * ---------------------------------------------------------------------
     * EXAMPLE — fill this in and delete the `null` below:
     *
     *   portrait: {
     *       type: 'image',
     *       src: 'assets/images/isaac-portrait.webp',
     *       width: 800,
     *       height: 1000,
     *
     *       // >>> CONFIRM THIS ONCE YOU HAVE PICKED THE PHOTOGRAPH <<<
     *       // Alt text describes what is actually in the frame, for someone
     *       // who cannot see it. The draft below is a shape to fill in, not
     *       // a fact — rewrite it to match your real photograph before it
     *       // goes live, and do not ship it as-is.
     *       //   e.g. 'Isaac at a workbench, setting up a part on the CNC'
     *       //   e.g. 'Isaac holding a 3D-printed component in the lab'
     *       // One sentence. No "photo of" or "image of" — a screen reader
     *       // already says it is an image.
     *       alt: 'Isaac ...',
     *
     *       // OPTIONAL retina / responsive set. Paths resolve exactly like
     *       // `src`, so write them from the site root the same way.
     *       srcset: [
     *           { src: 'assets/images/isaac-portrait.webp',    descriptor: '800w'  },
     *           { src: 'assets/images/isaac-portrait@2x.webp', descriptor: '1600w' }
     *       ],
     *       sizes: '(max-width: 900px) 320px, 30vw'
     *
     *       // OPTIONAL ratio override, only if your crop is not 4:5:
     *       // ratio: '3 / 4'
     *   },
     * ------------------------------------------------------------------- */
    portrait: null,

    /* ---------------------------------------------------------------------
     * HOME PAGE CARDS
     * One optional image or video per featured card, shown above the title.
     * Landscape crops around 4:3 or 16:9 sit best. Keep them consistent with
     * each other; four different shapes will read as noise.
     *
     * EXAMPLE — a still:
     *   'digital-kintsugi': {
     *       type: 'image',
     *       src: 'assets/digital-kintsugi/card.webp',
     *       alt: 'The repaired ceramic vessel, gold seam catching the light',
     *       width: 1200, height: 900
     *   },
     *
     * EXAMPLE — a silent loop:
     *   'museum-npc': {
     *       type: 'video',
     *       poster: 'assets/museum-npc/card-poster.webp',
     *       alt: 'A visitor talking with an NPC in the museum scene',
     *       width: 1200, height: 900,
     *       sources: [
     *           { src: 'assets/museum-npc/card.webm', type: 'video/webm' },
     *           { src: 'assets/museum-npc/card.mp4',  type: 'video/mp4'  }
     *       ]
     *   },
     * ------------------------------------------------------------------- */
    featured: {
        'digital-kintsugi': null,
        'museum-npc': null,
        'suzume-cnc-stool': null,
        'butterfly-pavilion': null
    },

    /* ---------------------------------------------------------------------
     * PROJECT PAGES
     * `hero` is the single lead image or video, shown under the metadata.
     * `gallery` is everything after it, in the order you list it.
     *
     * EXAMPLE:
     *   'digital-kintsugi': {
     *       hero: {
     *           type: 'image',
     *           src: 'assets/digital-kintsugi/hero.webp',
     *           alt: 'The finished vessel on a dark surface',
     *           width: 1600, height: 900
     *       },
     *       gallery: [
     *           { type: 'image', src: 'assets/digital-kintsugi/process-01.webp',
     *             alt: 'The vessel mid-print on the ceramic printer',
     *             width: 1200, height: 900, caption: 'Ceramic print in progress' },
     *
     *           { type: 'image', src: 'assets/digital-kintsugi/process-02.webp',
     *             alt: 'Scanned mesh of the fractured piece open in Rhino',
     *             width: 1200, height: 900, caption: 'Scan reconstruction' },
     *
     *           { type: 'video', span: 'full',
     *             poster: 'assets/digital-kintsugi/assembly-poster.webp',
     *             alt: 'The PLA component being fitted to the break',
     *             width: 1600, height: 900,
     *             caption: 'Fitting the repair component',
     *             sources: [
     *                 { src: 'assets/digital-kintsugi/assembly.webm', type: 'video/webm' },
     *                 { src: 'assets/digital-kintsugi/assembly.mp4',  type: 'video/mp4'  }
     *             ] }
     *       ]
     *   },
     * ------------------------------------------------------------------- */
    projects: {
        'digital-kintsugi': { hero: null, gallery: [] },
        'museum-npc': { hero: null, gallery: [] },
        'suzume-cnc-stool': { hero: null, gallery: [] },
        'butterfly-pavilion': { hero: null, gallery: [] }
    }
};

/*
 * Where this file lives, captured while it is still executing. script.js
 * resolves every path above against this, so "assets/x.webp" is correct from
 * any page depth and under any repository sub-path on GitHub Pages.
 */
window.SITE_MEDIA.baseURL = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/[^/]*$/, '')
    : new URL('.', location.href).href;
