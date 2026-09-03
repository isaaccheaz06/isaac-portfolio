/*
 * SITE MEDIA CONFIG — the one file to edit when you add photos or video.
 *
 * Every path is relative to assets/ and is resolved against baseURL at the
 * foot of this file, so entries work from any page depth.
 *
 * Fields: src, width, height (real pixels — they reserve the box and stop
 * the page jumping), alt, optional caption, optional poster and sources for
 * video, and mode: 'preview' (muted autoplay loop, still under
 * prefers-reduced-motion) or 'player' (native controls, never autoplays).
 * A null or an empty [] renders nothing at all rather than an empty slot.
 *
 * Filenames, formats, sizes and the mode rules: assets/README.md.
 * What each file shows, with its alt text: assets/MEDIA-MANIFEST.md.
 */

window.SITE_MEDIA = {

    /* ---------- about portrait ---------- */
    portrait: {
        type: 'image',
        src: 'assets/images/isaac-about.webp',
        width: 1000,
        height: 1500,

        /*
         * Me.JPG is 6000x4000 on disk with an EXIF orientation of 8, so it is
         * really a 4000x6000 upright. The derivative below is already rotated.
         */
        alt: 'Isaac Cheaz seated outdoors at night, in a red hooded jacket '
            + 'and black scarf.'
    },

    /* ---------- homepage cards ---------- */
    featured: {
        'digital-kintsugi': {
            type: 'image',
            src: 'assets/digital-kintsugi/digital-kintsugi-final-card.webp',
            alt: 'Completed blue ceramic Digital Kintsugi vase with gold repair '
                + 'seams and a custom fabricated replacement component.',
            width: 1200, height: 900
        },
        'museum-npc': {
            type: 'image',
            src: 'assets/museum-npc/project-page-img.webp',
            alt: 'A hanging calligraphy scroll with three brushed characters and a '
                + 'red seal stamp, in a rendered gallery interior.',
            width: 2000, height: 1210
        },

        'suzume-cnc-stool': {
            type: 'image',
            src: 'assets/suzume-cnc-stool/card.webp',
            alt: 'A small wooden chair with a slotted back panel and diamond '
                + 'inlays across the seat, on a workshop tabletop.',
            width: 1500, height: 1125
        },

        'butterfly-pavilion': {
            type: 'image',
            src: 'assets/butterfly-pavilion/card.webp',
            alt: 'A white paper model of a curved, perforated canopy, with a '
                + 'scale figure standing beneath the patterned light it casts.',
            width: 1500, height: 1125
        }
    },

    /* ---------------------------------------------------------------------
     * PROJECT PAGES
     * `hero` + `gallery`, or `sections` for a sectioned layout. A project
     * that sets `sections` must not also set hero/gallery — js/project.js
     * renders one shape or the other, not both.
     * ------------------------------------------------------------------ */
    projects: {
        /*
         * Digital Kintsugi uses `sections` instead of hero/gallery.
         */
        'digital-kintsugi': {
            sections: [

                {
                    layout: 'hero',

                    /*
                     * Both files are 3:4, so swapping between them moves nothing
                     * on the page.
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

                    playLabel: 'Play preview',
                    pauseLabel: 'Show still'
                },

                {
                    layout: 'editorial',
                    label: 'Prototype',

                    /* Optional. Both print as prose; an empty string prints nothing. */

                    // under the section heading, above the media
                    intro: 'To prototype the ceramic vase, I used an Eazao Ceramic 3D Printer '
                        + 'provided by the fab lab. The first challenge was finding a clay '
                        + 'mixture that would extrude consistently while remaining firm '
                        + 'enough to hold its shape. I tested several ratios of dry clay '
                        + 'and water using a small watering-can model, repeating the print '
                        + 'until I found a mixture I was satisfied with. The final ratio '
                        + 'was 500 grams of dry clay to 100 grams of water. I loaded the '
                        + 'mixture into a syringe connected by tubing to the printer nozzle.'
                        + '\n\n'
                        + 'Each ceramic print took approximately three to five hours. '
                        + 'Because I was concerned that the wet clay might collapse under '
                        + 'its own weight, I mounted a heat gun beside the printer to help '
                        + 'dry and stabilize the layers as they were deposited. Over two '
                        + 'weeks, I printed several versions and used approximately one '
                        + 'kilogram of dry clay. The earlier, unfired pieces were extremely '
                        + 'brittle, so my professor recommended firing the later versions '
                        + 'in the school kiln.',

                    // after the media, for a closing observation
                    outro: 'Before firing the vases, I applied a blue ceramic glaze. For each '
                        + 'firing cycle, the kiln began at approximately 100\u00b0C and '
                        + 'increased by around 100\u00b0C each hour until it reached '
                        + '600\u2013700\u00b0C. It then cooled gradually using the reverse '
                        + 'schedule. The complete firing and cooling process took an entire '
                        + 'night each time.'
                        + '\n\n'
                        + 'During firing, the glaze melted and caused the vase to adhere to '
                        + 'the surface beneath it. When I removed the vase, part of its '
                        + 'bottom broke away. This created both an obstacle and an '
                        + 'opportunity: the accidental break gave me a real fracture to '
                        + 'reconstruct with a 3D-printed PLA component, although it also '
                        + 'removed my ability to choose which part of the vase would be '
                        + 'replaced. Printing the replacement PLA component took '
                        + 'approximately one hour.'
                        + '\n\n'
                        + 'Several of the fired vases still broke, so I ultimately continued '
                        + 'with a smaller version that survived the process. The final piece '
                        + 'had a glossy blue, porcelain-like finish.',

                    /*
                     * Read across, then down: the test print, the slump it taught
                     * me about, the broken prototype, the printer running, the vase
                     * that survived. The feature stays on the left in both blocks so
                     * the five frames read 1-5 in one direction rather than
                     * alternating, and the stack on a phone is that same order.
                     */
                    blocks: [
                        {
                            /*
                             * Two frames down one column against one tall frame: the
                             * watering-can test and the slump it taught me about, beside
                             * the vase that came out of the kiln broken.
                             *
                             * The pair is written first because it happened first, and
                             * the renderer keeps that order in the markup, so a phone
                             * reads 02, 03, 04 rather than meeting the outcome first.
                             */
                            variant: 'stacked-pair',
                            support: [
                                {
                                    type: 'image', src: 'assets/digital-kintsugi/process-02.webp',
                                    alt: 'The extruder nozzle laying a coil of clay onto a small '
                                        + 'cylindrical test print',
                                    width: 900, height: 1200,
                                    /* caption prints under this frame only */
                                    caption: ''
                                },
                                {
                                    type: 'image', src: 'assets/digital-kintsugi/process-03.webp',
                                    alt: 'The same test print after failure, one extrusion '
                                        + 'slumped away from the wall',
                                    width: 900, height: 1200,
                                    caption: ''
                                }
                            ],
                            feature: {
                                type: 'image', src: 'assets/digital-kintsugi/process-04.webp',
                                alt: 'A hand holding a broken fragment above a painted prototype '
                                    + 'vessel missing a piece of its wall, shards on the cutting mat',
                                width: 900, height: 1200,
                                caption: '',
                            }
                        },
                        {
                            feature: {
                                type: 'video', mode: 'preview',
                                src: 'assets/digital-kintsugi/ceramic-printing-loop.mp4',
                                poster: 'assets/digital-kintsugi/ceramic-printing-loop-poster.webp',
                                alt: 'A clay extruder mounted on a gantry printing a small '
                                    + 'vessel on a fab lab workbench',
                                width: 540, height: 960,
                                caption: '',
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
                 * One viewer rather than five clips in a column. Each stage
                 * is an image or a video.
                 */
                {
                    layout: 'carousel',
                    label: 'Final Design',

                    /* `description` is optional; an empty one prints nothing. */
                    slides: [
                        {
                            title: 'Physical 3D scanning',
                            description: "I need to scan the physical fracture in order to have a reference on how the 3D printed piece should roughly look like. It didn't need to be perfect since I could fill in the gaps with the kintsugi technique later on. The process took a bit of back and forth so that I got every detail of the vase.",
                            media: {
                                type: 'video', mode: 'preview',
                                src: 'assets/digital-kintsugi/scanning-loop.mp4',
                                poster: 'assets/digital-kintsugi/scanning-loop-poster.webp',
                                alt: 'A handheld 3D scanner passing over the fractured vessel, '
                                    + 'projected light on the table and the capture building on screen',
                                width: 540, height: 960
                            }
                        },

                        {
                            title: 'Scan result',
                            description: "The result showed the fractured vase and also some residual geometry from the table that needed to be cleaned up. Conveniently, the vase was detached from the scanned table, so it was a matter of selecting and deleting the table's geometry in Rhino.",
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
                            description: 'The replacement geometry was made using a set of points manually placed on the fractured surface and then extruded and hollowed out using various techniques. It was then tested against the scan by overlaying it and checking for alignment and fit.',
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
                            description: 'The final step was to mix gold pigment into epoxy and work it into the breaks of the vase. Instead of fixing the original fractures with the original broken pieces, a "stronger" PLA component was used to repair the damage.',
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
                 * The full film stays on Google Drive: the smallest watchable
                 * encode is ~19MB, twice the rest of the repository.
                 */
                {
                    layout: 'film',
                    title: 'Full Project Film',
                    text: 'A complete record of the project\u2019s development, from initial '
                        + 'planning and material testing through fabrication, reconstruction, '
                        + 'and final assembly.',
                    src: 'https://drive.google.com/file/d/1j3IB8NMIRCQF6sBq-4mrryxqNUZlOXpF/preview',
                    href: 'https://drive.google.com/file/d/1j3IB8NMIRCQF6sBq-4mrryxqNUZlOXpF/view',
                    /* Optional closing note. Renders under the film. */
                    reflection: 'Edited in DaVinci Resolve and exported at 1080p, the three-minute '
                        + 'film condenses several weeks of prototyping, fabrication, scanning, '
                        + 'and final assembly into one process record.\n\n'
                        + 'Opening footage: BuzzFeed Nifty, \u201cThe Art of Kintsugi.\u201d '
                        + 'Music: \u201cNotion\u201d by The Rare Occasions (2016).',
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

            ]
        },
        'museum-npc': { hero: null, gallery: [] },
        'suzume-cnc-stool': { hero: null, gallery: [] },
        'butterfly-pavilion': { hero: null, gallery: [] }
    }
};

/*
 * Where this file lives, captured while it is still executing. The page scripts
 * resolves every path above against it, so "assets/x.webp" is correct from
 * any page depth and under any repository sub-path on GitHub Pages.
 */
window.SITE_MEDIA.baseURL = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/[^/]*$/, '')
    : new URL('.', location.href).href;
