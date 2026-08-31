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
 *   2. Fill in its row in assets/MEDIA-MANIFEST.md — what it shows, its alt
 *      text, its caption. That file is the authoritative description of every
 *      asset, because a filename cannot tell you what is in the frame.
 *   3. Replace the matching `null` or empty [] below with a media object,
 *      copying the alt and caption across from the manifest.
 *   4. Reload. Nothing else to wire up.
 *
 * FILENAMES follow the convention in assets/README.md:
 *   card / card-loop / hero / cad-NN / process-NN / final-NN /
 *   process-film / process-film-poster / unity-editor-NN / game-view-NN /
 *   conversation-NN
 * Lowercase kebab-case, two-digit numbers. No file is required; anything
 * absent is simply not configured here.
 *
 * EXTENSIONS: .webp and .jpg are both fine. Write the extension the file
 * actually has. Nothing rewrites .jpg to .webp, nothing tries a second
 * extension, and there is no fallback if a path 404s — so never write a
 * .webp path on the assumption that a WebP twin exists.
 *
 * CASE MATTERS. GitHub Pages is case-sensitive; Windows is not. "hero.JPG"
 * on disk written as "hero.jpg" here works perfectly on your machine and
 * 404s on the live site. Keep every filename lowercase, extension included.
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
 *     mode:    'preview' | 'player'   video only. See VIDEO MODES below.
 *                                     Defaults to 'preview' when omitted.
 *
 *     poster:  'assets/slug/demo-poster.webp'   video only, strongly advised.
 *                                     Shown before playback, and shown INSTEAD
 *                                     of the video for visitors who have asked
 *                                     for reduced motion. REQUIRED in practice
 *                                     for mode:'player' — without one the
 *                                     player is a black box until pressed.
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
 * ---------------------------------------------------------------------------
 * VIDEO MODES
 * ---------------------------------------------------------------------------
 * Two kinds of video, and they must not be confused. Pick with `mode`.
 *
 *   mode: 'preview'   (the default)
 *     For card-loop.mp4 and other short silent loops used as imagery.
 *       - muted, autoplaying, looping, playsinline
 *       - no controls, not focusable, hidden from screen readers
 *       - plays only while on screen; pauses offscreen and in a hidden tab
 *       - shows its poster instead of playing under prefers-reduced-motion
 *     Keep these to 6-10 seconds and strip the audio track entirely — a
 *     muted track is still weight, and a track at all can block autoplay.
 *
 *   mode: 'player'
 *     For process-film.mp4 and the full Blender animation.
 *       - controls, playsinline, preload='metadata'
 *       - does NOT autoplay, does NOT loop, audio permitted
 *       - stays paused until the visitor presses play
 *       - keyboard operable through the native controls; `alt` becomes its
 *         accessible name
 *       - untouched by prefers-reduced-motion, because it never moves on its
 *         own in the first place
 *     Give it a `poster`. Without one it renders as a black rectangle.
 *
 * A complete film is not wallpaper. Configuring one as a preview would loop
 * it silently forever and hide it from screen readers; that is why the modes
 * exist. Entries with no `mode` behave exactly as they did before it was
 * added, so nothing already configured needs revisiting.
 *
 * On the homepage cards `mode` is ignored and everything is a preview —
 * native controls inside a card's link would be a control nested in a link.
 * Full films belong on the project page the card leads to.
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
     * EXAMPLE — the same card as a JPG, because that is what you uploaded:
     *   'suzume-cnc-stool': {
     *       type: 'image',
     *       src: 'assets/suzume-cnc-stool/card.jpg',
     *       alt: 'The finished stool seen from the front, three legs splayed',
     *       width: 1200, height: 900
     *   },
     *
     * EXAMPLE — a silent loop (mode:'preview' is the default, shown here for
     * clarity). Its poster is the card still:
     *   'butterfly-pavilion': {
     *       type: 'video',
     *       mode: 'preview',
     *       poster: 'assets/butterfly-pavilion/card.webp',
     *       alt: 'The pavilion model rotating slowly on a turntable',
     *       width: 1200, height: 900,
     *       src: 'assets/butterfly-pavilion/card-loop.mp4'
     *   },
     * ------------------------------------------------------------------- */
    featured: {
        /*
         * The COMPLETED piece. The earlier card was cropped from a photograph
         * taken before the fabricated replacement component was fitted — the
         * base is notched and empty in it — so it showed an unfinished object
         * as the finished one. This frame carries the teal replacement band
         * and the gold seam that joins it.
         *
         * Cropped to 4:3 deliberately: the card slot is landscape and crops
         * with object-fit, so an upright frame handed to it straight would
         * keep only a middle band. The crop was framed to contain the whole
         * object, replacement component included.
         */
        'digital-kintsugi': {
            type: 'image',
            src: 'assets/digital-kintsugi/digital-kintsugi-final-card.webp',
            alt: 'Completed blue ceramic Digital Kintsugi vase with gold repair '
                + 'seams and a custom fabricated replacement component.',
            width: 1200, height: 900
        },
        'museum-npc': null,
        'suzume-cnc-stool': null,
        'butterfly-pavilion': null
    },

    /* ---------------------------------------------------------------------
     * PROJECT PAGES
     * `hero` is the single lead image or video, shown under the metadata.
     * `gallery` is everything after it, in the order you list it — so the
     * array order IS the reading order. List cad-NN, process-NN and final-NN
     * in the sequence you want them read, not alphabetically.
     *
     * EXAMPLE — the shape a finished project takes:
     *   'digital-kintsugi': {
     *       hero: {
     *           type: 'image',
     *           src: 'assets/digital-kintsugi/hero.webp',
     *           alt: 'The finished vessel on a dark surface',
     *           width: 1600, height: 900
     *       },
     *       gallery: [
     *           { type: 'image', src: 'assets/digital-kintsugi/cad-01.webp',
     *             alt: 'Scanned mesh of the fractured piece open in Rhino',
     *             width: 1200, height: 900, caption: 'Scan reconstruction' },
     *
     *           // a JPG straight off the camera, not converted — fine
     *           { type: 'image', src: 'assets/digital-kintsugi/process-01.jpg',
     *             alt: 'The vessel mid-print on the ceramic printer',
     *             width: 1200, height: 900, caption: 'Ceramic print in progress' },
     *
     *           { type: 'image', src: 'assets/digital-kintsugi/final-01.webp',
     *             alt: 'The repaired vessel lit from the side',
     *             width: 1200, height: 900 },
     *
     *           // THE FULL FILM. mode:'player' — controls, no autoplay, no
     *           // loop, audio allowed, nothing downloaded until pressed.
     *           { type: 'video', mode: 'player', span: 'full',
     *             src: 'assets/digital-kintsugi/process-film.mp4',
     *             poster: 'assets/digital-kintsugi/process-film-poster.webp',
     *             alt: 'Process film: scanning, printing and fitting the repair',
     *             width: 1920, height: 1080,
     *             caption: 'Start to finish' }
     *       ]
     *   },
     *
     * Two files for one video, only if you have both encodes — the browser
     * takes the first it understands:
     *           { type: 'video', mode: 'player',
     *             poster: 'assets/slug/process-film-poster.webp',
     *             alt: '...', width: 1920, height: 1080,
     *             sources: [
     *                 { src: 'assets/slug/process-film.webm', type: 'video/webm' },
     *                 { src: 'assets/slug/process-film.mp4',  type: 'video/mp4'  }
     *             ] }
     *
     * OPTIONAL `links`: external links shown near the top of a project page.
     * The Museum page carries two. They live in that page's own markup rather
     * than here, because a link is content and must survive JavaScript being
     * off — see projects/museum-npc.html.
     * ------------------------------------------------------------------- */
    projects: {
        /*
         * DIGITAL KINTSUGI — sectioned layout.
         *
         * `sections` replaces hero/gallery for this project. Rendered flat,
         * thirteen upright clips and photographs read as a pile of GIFs with
         * no argument; this gives the same assets a rhythm — a dominant final
         * frame against a small loop, alternating feature/support blocks, one
         * viewer for the object-to-model sequence, and a quiet close.
         *
         * Every source is portrait, so nothing is run at the full measure.
         */
        'digital-kintsugi': {
            sections: [

                /*
                 * THE FINISHED OBJECT — one frame, motion on request.
                 *
                 * This was two elements side by side: the photograph and the
                 * loop, which show the same vase from the same angle. The row
                 * said one thing twice, and because the two files are
                 * different shapes the stagger between them read as an
                 * accident rather than a composition.
                 *
                 * Now the still is the resting state and the clip is layered
                 * over it, faded in on hover or by the button beneath. The
                 * photograph is what loads, what prints, and what stays on
                 * screen if the video cannot play.
                 */
                {
                    layout: 'hero',

                    /*
                     * Both files are 3:4, so the frame crops neither and
                     * swapping between them moves nothing on the page.
                     *
                     * final-loop-3x4.mp4 is a derivative made for exactly
                     * this. The camera pulls back through the original shot,
                     * and across all 172 frames the vase never rises above
                     * row 352 of 1280 — so the 320 rows removed from the top
                     * are bare wall in every frame, with 30px to spare at the
                     * tightest. The 9:16 original is untouched beside it.
                     */
                    ratio: '3 / 4',

                    image: {
                        type: 'image',
                        src: 'assets/digital-kintsugi/digital-kintsugi-final-hero.webp',
                        alt: 'Completed blue ceramic Digital Kintsugi vase with gold repair '
                            + 'seams and a custom fabricated replacement component.',
                        width: 1200, height: 1600
                    },

                    video: {
                        type: 'video', mode: 'preview',
                        src: 'assets/digital-kintsugi/final-loop-3x4.mp4',
                        alt: 'The completed vase turning slowly, gold seams catching the light',
                        width: 720, height: 960
                    },

                    playLabel: 'Play',
                    pauseLabel: 'Revert'
                },

                /* --- printing the form, and the things that broke --- */
                {
                    layout: 'editorial',
                    label: 'Prototype',

                    /* ------------------------------------------------------
                     * OPTIONAL WRITING.
                     *
                     * Both fields below are empty strings, and nothing renders
                     * for an empty string — no element, no margin, no gap.
                     * Replace the '' with a sentence and it appears; leave it
                     * and the page is exactly as it is now.
                     *
                     * PARAGRAPH BREAK: put \n\n inside the quotes.
                     *     intro: 'First paragraph.\n\nSecond paragraph.'
                     *
                     * Prompts to write against (never shown on the page):
                     *   - What was this prototype testing?
                     *   - What failed or behaved unexpectedly?
                     *   - What changed in the next iteration?
                     *   - Why was ceramic 3D printing right for the concept?
                     *   - What did the physical tests reveal that the CAD
                     *     model did not?
                     * ---------------------------------------------------- */

                    // under the section heading, above the media
                    intro: '',

                    // after the media, for a closing observation
                    outro: '',

                    blocks: [
                        {
                            feature: {
                                type: 'video', mode: 'preview',
                                src: 'assets/digital-kintsugi/ceramic-printing-loop.mp4',
                                poster: 'assets/digital-kintsugi/ceramic-printing-loop-poster.webp',
                                alt: 'A clay extruder mounted on a gantry printing a small '
                                    + 'vessel on a fab lab workbench',
                                width: 540, height: 960,
                                caption: '',
                                // caption: 'Ceramic printing and material testing'
                            },
                            support: [
                                {
                                    type: 'image', src: 'assets/digital-kintsugi/process-02.webp',
                                    alt: 'The extruder nozzle laying a coil of clay onto a small '
                                        + 'cylindrical test print',
                                    width: 900, height: 1200,
                                    /*
                                     * caption: '' prints one line under
                                     * THIS frame only. Deliberately not
                                     * on every image — explain the ones
                                     * that need it and leave the rest,
                                     * or the section becomes a wall of
                                     * text. Prompt: what changed, failed
                                     * or was learned here?
                                     */
                                    caption: ''
                                },
                                {
                                    type: 'image', src: 'assets/digital-kintsugi/process-03.webp',
                                    alt: 'The same test print after failure, one extrusion '
                                        + 'slumped away from the wall',
                                    width: 900, height: 1200,
                                    caption: ''
                                }
                            ]
                        },
                        {
                            flip: true,
                            feature: {
                                type: 'image', src: 'assets/digital-kintsugi/process-04.webp',
                                alt: 'A hand holding a broken fragment above a painted prototype '
                                    + 'vessel missing a piece of its wall, shards on the cutting mat',
                                width: 900, height: 1200,
                                caption: '',
                                // caption: 'Early prototype and fit testing'
                            },
                            support: [
                                {
                                    type: 'image', src: 'assets/digital-kintsugi/process-01.webp',
                                    alt: 'An unfired printed clay vase on a plywood board, its '
                                        + 'coil layers visible',
                                    width: 900, height: 1200,
                                    caption: ''
                                }
                            ]
                        }
                    ]
                },

                /*
                 * The object-to-model sequence, as one viewer rather than five
                 * more clips in a column. Each entry is a stage with a name,
                 * which is what makes the run legible; the viewer plays only
                 * the active one.
                 *
                 * Four stages, not five. A 'Prototype insert fitting' slide sat
                 * here showing process-05 — an insert being tried in an early
                 * PROTOTYPE vessel, not the final piece. In a sequence about
                 * reconstructing the finished vase it read as part of that
                 * work, which it is not. The file is untouched on disk and its
                 * source is untouched in the archive; it is simply not shown.
                 */
                {
                    layout: 'carousel',
                    label: 'Final Design',

                    /*
                     * Every stage may carry a `description` beside its title.
                     * An empty one prints nothing and leaves no gap; the line
                     * swaps as the stage changes. Keep them to a sentence.
                     */
                    slides: [
                        {
                            title: 'Physical 3D scanning',
                            description: "I need to scan the physical fracture in order to have a reference on how the 3D printed piece should roughly look like. It didn't need to be perfect since I could fill in the gaps with the kintsugi technique later on. The process took a bit of back and forth so that I got every detail of the vase.", // Why did the physical fracture need to become digital geometry?
                            media: {
                                type: 'video', mode: 'preview',
                                src: 'assets/digital-kintsugi/scanning-loop.mp4',
                                poster: 'assets/digital-kintsugi/scanning-loop-poster.webp',
                                alt: 'A handheld 3D scanner passing over the fractured vessel, '
                                    + 'projected light on the table and the capture building on screen',
                                width: 600, height: 960
                            }
                        },

                        {
                            title: 'Scan result',
                            description: "The result showed the fractured vase and also some residual geometry from the table that needed to be cleaned up. Conveniently, the vase was detached from the scanned table, so it was a matter of selecting and deleting the table's geometry in Rhino.", // What needed to be cleaned, isolated, or interpreted?
                            media: {
                                type: 'video', mode: 'preview',
                                src: 'assets/digital-kintsugi/scan-result-loop.mp4',
                                poster: 'assets/digital-kintsugi/scan-result-loop-poster.webp',
                                alt: 'The raw scan mesh on screen, the vessel wall captured '
                                    + 'alongside a large flat artefact',
                                width: 540, height: 960
                            }
                        },

                        {
                            title: 'Rhino replacement fitting',
                            description: 'The replacement geometry was made using a set of points manually placed on the fractured surface and then extruded and hollowed out using various techniques. It was then tested against the scan by overlaying it and checking for alignment and fit.', // How was the replacement geometry tested against the scan?
                            media: {
                                type: 'video', mode: 'preview',
                                src: 'assets/digital-kintsugi/rhino-fit-loop.mp4',
                                poster: 'assets/digital-kintsugi/rhino-fit-loop-poster.webp',
                                alt: 'The scanned mesh open in Rhino with a wireframe '
                                    + 'replacement component positioned against the break',
                                width: 540, height: 960
                            }
                        },

                        {
                            title: 'Gold repair',
                            description: 'The final step was to mix gold pigment into epoxy and work it into the breaks of the vase. Instead of fixing the original fractures with the original broken pieces, a "stronger" PLA component was used to repair the damage.', // How did the fabricated component connect to the repair concept?
                            media: {
                                type: 'video', mode: 'preview',
                                src: 'assets/digital-kintsugi/gold-repair.mp4',
                                poster: 'assets/digital-kintsugi/gold-repair-poster.webp',
                                alt: 'Mixing gold pigment into epoxy and working it into '
                                    + 'the breaks of the vessel',
                                width: 720, height: 1280
                            }
                        }
                    ]
                },

                /*
                 * The full film stays on Google Drive. The smallest watchable
                 * encode is ~19MB — twice the rest of the page — and git would
                 * keep every version forever, so nothing is copied in here.
                 * The iframe is created only when the play control is pressed,
                 * so no third-party request happens until it is asked for.
                 */
                {
                    layout: 'film',
                    title: 'Full Project Film',
                    text: 'A complete record of the project\u2019s development, from initial '
                        + 'planning and material testing through fabrication, reconstruction, '
                        + 'and final assembly.',
                    src: 'https://drive.google.com/file/d/1j3IB8NMIRCQF6sBq-4mrryxqNUZlOXpF/preview',
                    href: 'https://drive.google.com/file/d/1j3IB8NMIRCQF6sBq-4mrryxqNUZlOXpF/view',
                    /* ------------------------------------------------------
                     * OPTIONAL REFLECTION.
                     *
                     * Renders between the overview above and the Drive link
                     * below, so the link stays the last thing in the block.
                     * Empty string renders nothing at all. \n\n for a
                     * paragraph break, same as the fields above.
                     *
                     * Prompts (never shown on the page):
                     *   - What does the film communicate better than stills?
                     *   - Which part of the process best represents this?
                     *   - What would you approach differently next time?
                     * ---------------------------------------------------- */
                    reflection: 'The Project Film was completed edited in Davinci Resolve and exported as a 1080p MP4. In terms of credits, the initial clip used at the start of the film was borrowed from BuzzFeed Nifty\'s "The Art of Kintsugi". The background music used in the film was "Notion" by The Rare Occasions ‧ 2016. As for the film\'s content itself, it includes various timelapses and images taken during the prototyping stage all the way to the final assembly that then condensed the work of multiple weeks into a 3-minute long video.',
                    reflectionLabel: 'Film note',

                    iframeTitle: 'Digital Kintsugi full project film',
                    playLabel: 'Watch Now',
                    linkLabel: 'Open film in Google Drive',
                    ratio: '9 / 16',
                    poster: {
                        type: 'image',
                        src: 'assets/digital-kintsugi/digital-kintsugi-final-hero.webp',
                        alt: '',
                        width: 1200, height: 1600
                    },
                    // the frame is 9:16 and the still 3:4, so cover crops the
                    // width; hold it on the vase rather than the default centre
                    posterPosition: '52% 46%'
                }

                /*
                 * The page ends on the film. A closing detail crop sat here —
                 * a tight frame of the lower vase — and read as one more media
                 * block rather than a conclusion, so it is no longer shown.
                 * digital-kintsugi-final-detail.webp is still on disk, and the
                 * photograph it was cropped from still leads the page and
                 * posters the film.
                 */
            ]
        },
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
