const navbar = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

// guarded: this file is shared with pages that may not render a navbar,
// and an unguarded classList call here throws on every scroll frame
if (navbar) {
    /*
     * The navbar is sticky, so clicking a nav link (#work, #about, #contact)
     * lands the target's top edge at viewport y=0 — directly underneath it,
     * hiding part of the heading. --navbar-height feeds scroll-margin-top on
     * those sections so the browser stops short by the navbar's own height
     * instead. Measured rather than hardcoded because the height changes
     * across breakpoints and grows if the logo ever wraps to two lines.
     */
    const setNavbarHeight = () => {
        document.documentElement.style.setProperty('--navbar-height', `${navbar.offsetHeight}px`);
    };

    setNavbarHeight();
    window.addEventListener('resize', setNavbarHeight);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(setNavbarHeight);
    }

    /*
     * Anchor navigation vs. auto-hide.
     *
     * Jumping to #work/#about/#contact always scrolls DOWN, which tripped the
     * auto-hide below. The browser had already reserved --navbar-height of
     * clearance via scroll-margin-top, so the section landed correctly but the
     * bar it was making room for had slid away — leaving a void at the top,
     * and snapping back over the heading the moment the user scrolled up 1px.
     *
     * Holding the bar visible for the duration of the jump makes the reserved
     * space correct: the heading comes to rest directly beneath a bar that is
     * actually there.
     */
    let anchorNavigating = false;
    let anchorNavStartedAt = 0;
    let settleTimer = null;

    /*
     * With scroll-behavior:auto — which is what prefers-reduced-motion users
     * get — the jump is instantaneous and scrollend can fire in the same
     * frame, releasing the guard before the trailing scroll events have
     * settled and letting the auto-hide fire anyway. Holding the guard for a
     * short floor covers that, and the explicit un-hide here guarantees we
     * always come to rest with the bar visible however the race resolves.
     */
    const MIN_GUARD_MS = 350;

    const endAnchorNav = () => {
        anchorNavigating = false;
        lastScrollY = window.scrollY;
        navbar.classList.remove('navbar-hidden');
    };

    const beginAnchorNav = () => {
        anchorNavigating = true;
        anchorNavStartedAt = performance.now();
        navbar.classList.remove('navbar-hidden');
        clearTimeout(settleTimer);
        // fallback for browsers without scrollend, and a backstop if the
        // scroll is interrupted before it ever settles
        settleTimer = setTimeout(endAnchorNav, 1400);
    };

    // only same-page hashes that actually resolve to an element on this page
    const isInPageAnchor = (hash) => hash.length > 1 && document.getElementById(hash.slice(1));

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href*="#"]');
        if (!link) return;

        const url = new URL(link.href, location.href);
        if (url.pathname !== location.pathname || url.origin !== location.origin) return;
        if (!isInPageAnchor(url.hash)) return;

        beginAnchorNav();
    });

    // back/forward between hashes, and links that change the hash directly
    window.addEventListener('hashchange', () => {
        if (isInPageAnchor(location.hash)) beginAnchorNav();
    });

    // landing directly on /#work with the bar already scrolled out of view
    if (isInPageAnchor(location.hash)) beginAnchorNav();

    if ('onscrollend' in window) {
        window.addEventListener('scrollend', () => {
            if (!anchorNavigating) return;

            const elapsed = performance.now() - anchorNavStartedAt;
            clearTimeout(settleTimer);

            if (elapsed < MIN_GUARD_MS) {
                settleTimer = setTimeout(endAnchorNav, MIN_GUARD_MS - elapsed);
                return;
            }

            endAnchorNav();
        });
    }

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (anchorNavigating) {
            // keep the bar pinned and stay in sync, so the first real scroll
            // after the jump compares against where we actually ended up
            lastScrollY = currentScrollY;
            return;
        }

        if (currentScrollY > lastScrollY && currentScrollY > 80) {
            navbar.classList.add('navbar-hidden');
        } else if (currentScrollY < lastScrollY) {
            navbar.classList.remove('navbar-hidden');
        }

        lastScrollY = currentScrollY;
    });
}

/* ---------- featured cards: pointer parallax ---------- */

/*
 * Each card drifts against the cursor by an amount set by its data-depth,
 * on top of the static rotation it already carries in CSS. Decorative only:
 * the cards are ordinary links and behave identically without this.
 */
const featured = document.getElementById('featured');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(pointer: coarse)');

if (featured && !reduceMotion.matches && !coarsePointer.matches) {
    const cards = [...featured.querySelectorAll('.feature')].map((card) => ({
        el: card,
        depth: Number(card.dataset.depth) || 1,
        // captured once: the rotation set by .feature-N, which the drift
        // below has to re-apply or writing to style.transform would drop it
        rotation: getComputedStyle(card).transform,
    }));

    let frame = null;

    featured.addEventListener('mousemove', (event) => {
        if (frame) return;

        frame = requestAnimationFrame(() => {
            frame = null;
            const bounds = featured.getBoundingClientRect();
            const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
            const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

            for (const { el, depth, rotation } of cards) {
                const x = -offsetX * depth * 16;
                const y = -offsetY * depth * 16;
                el.style.transform = `translate(${x}px, ${y}px) ${rotation}`;
            }
        });
    });

    featured.addEventListener('mouseleave', () => {
        for (const { el } of cards) {
            el.style.transform = '';
        }
    });
}

/* ---------- magnetic letters ---------- */

/*
 * Splits the text content of any .magnetic-text element into one span per
 * character at runtime — the HTML source stays plain, editable text. Each
 * letter is nudged away from the cursor within a radius and springs back
 * via the CSS transition on .letter, so no per-frame easing math is needed
 * here beyond the displacement itself.
 */
const magneticRoots = document.querySelectorAll('.magnetic-text');

if (magneticRoots.length && !reduceMotion.matches && !coarsePointer.matches) {
    const RADIUS = 84;
    const MAX_LIFT = 15;
    const letters = [];

    let points = [];

    const measure = () => {
        points = letters.map((el) => {
            const rect = el.getBoundingClientRect();
            return { el, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
        });
    };

    // Letters are still mid-reveal (translateY(100%)) at the moment this
    // script runs, so measuring now would cache positions offset by a full
    // line-height. Wait for each line's own reveal to finish before trusting
    // its letters' rects; a line with no reveal animation (animation-name:
    // none) counts as already settled so the generic .magnetic-text path
    // still works without the line-mask pattern.
    let ready = false;
    let pendingLines = 0;
    let settledLines = 0;

    const onLineSettled = () => {
        settledLines++;
        measure();
        if (settledLines >= pendingLines) ready = true;
    };

    for (const root of magneticRoots) {
        const lines = root.querySelectorAll('.line-inner');
        const targets = lines.length ? lines : [root];
        pendingLines += targets.length;

        for (const line of targets) {
            const text = line.textContent;
            line.textContent = '';

            const words = text.split(' ');

            words.forEach((word, wordIndex) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'word';

                for (const char of word) {
                    const letterSpan = document.createElement('span');
                    letterSpan.className = 'letter';
                    letterSpan.textContent = char;
                    wordSpan.appendChild(letterSpan);
                    letters.push(letterSpan);
                }

                line.appendChild(wordSpan);

                if (wordIndex < words.length - 1) {
                    line.appendChild(document.createTextNode(' '));
                }
            });

            // the reveal mask only needs to clip while the line is sliding
            // in — left on, it would also clip the letters' own displacement
            const mask = line.closest('.line-mask');

            if (getComputedStyle(line).animationName === 'none') {
                onLineSettled();
            } else {
                line.addEventListener('animationend', () => {
                    if (mask) mask.style.overflow = 'visible';
                    onLineSettled();
                }, { once: true });
            }
        }
    }

    window.addEventListener('resize', measure);

    /*
     * The display face is loaded async with font-display: swap, so it can
     * land after the reveal finishes. When it does, every glyph advance
     * changes and the cached centres are silently wrong — letters would
     * then lift while the cursor is nowhere near them.
     */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(measure);
    }

    let frame = null;

    document.addEventListener('mousemove', (event) => {
        if (!ready || frame) return;

        frame = requestAnimationFrame(() => {
            frame = null;

            for (const { el, cx, cy } of points) {
                const distance = Math.hypot(cx - event.clientX, cy - event.clientY);

                if (distance >= RADIUS) {
                    el.style.transform = '';
                    continue;
                }

                /*
                 * Lift straight up rather than pushing radially away. A
                 * radial push scatters letters in every direction at once
                 * and reads as noise on a line of text; a vertical hop
                 * keeps the baseline legible and reads as the cursor
                 * sweeping letters up as it passes. Quadratic falloff so
                 * only letters genuinely near the cursor move much.
                 */
                const strength = (1 - distance / RADIUS) ** 2;
                el.style.transform = `translateY(${-strength * MAX_LIFT}px)`;
            }
        });
    });

    document.addEventListener('mouseleave', () => {
        for (const { el } of points) {
            el.style.transform = '';
        }
    });
}


/* ==========================================================================
 * MEDIA RENDERING
 *
 * Reads media.js and builds the markup for whatever is configured there.
 * Nothing configured means nothing is inserted — no empty frames, no
 * "image coming soon" labels, no broken-image icons. The cards and project
 * pages are laid out to look finished with type alone, so an unconfigured
 * site is a complete site rather than a half-built one.
 *
 * With JavaScript off the text, links and navigation all still work; only
 * the photographs are missing. That is the right way round.
 * ======================================================================== */

const siteMedia = window.SITE_MEDIA || null;

if (siteMedia) {

    const resolveURL = (path) => new URL(path, siteMedia.baseURL).href;

    const hasText = (v) => typeof v === 'string' && v.trim() !== '';

    /*
     * A config entry only counts as real if it can actually produce a
     * rendered element. Anything half-filled is skipped rather than
     * rendered as a broken reference.
     */
    const isPlayable = (m) =>
        (Array.isArray(m.sources) && m.sources.some((s) => hasText(s && s.src))) || hasText(m.src);

    const isValidMedia = (m) => {
        if (!m || typeof m !== 'object') return false;
        if (m.type === 'image') return hasText(m.src);
        if (m.type === 'video') return isPlayable(m);
        return false;
    };

    const applyBox = (el, m) => {
        if (Number(m.width) > 0) el.width = Number(m.width);
        if (Number(m.height) > 0) el.height = Number(m.height);
        if (hasText(m.ratio)) el.style.aspectRatio = m.ratio;
    };

    const buildImage = (m, opts) => {
        const o = opts || {};
        const img = document.createElement('img');
        img.src = resolveURL(o.src || m.src);
        // alt is always set, even to '', so the image is never announced by
        // its filename; an omitted alt attribute is what causes that
        const alt = o.alt !== undefined ? o.alt : m.alt;
        img.alt = hasText(alt) ? alt : '';
        img.decoding = 'async';
        if (o.eager) {
            img.fetchPriority = 'high';
        } else {
            img.loading = 'lazy';
        }
        applyBox(img, m);
        return img;
    };

    /*
     * Videos never carry the autoplay attribute. Playback is driven by the
     * IntersectionObserver below, so a clip that is never scrolled to is
     * never fetched and never decoded.
     */
    const buildVideo = (m) => {
        const video = document.createElement('video');
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.preload = 'none';
        video.tabIndex = -1;
        if (hasText(m.poster)) video.poster = resolveURL(m.poster);
        // a silent decorative loop is not a media player; keep it out of the
        // a11y tree and let the caption beside it carry the meaning
        video.setAttribute('aria-hidden', 'true');

        if (Array.isArray(m.sources) && m.sources.length) {
            for (const s of m.sources) {
                if (!hasText(s && s.src)) continue;
                const source = document.createElement('source');
                source.src = resolveURL(s.src);
                if (hasText(s.type)) source.type = s.type;
                video.appendChild(source);
            }
        } else {
            video.src = resolveURL(m.src);
        }

        applyBox(video, m);
        video.dataset.autoplayInView = 'true';
        return video;
    };

    /*
     * Under prefers-reduced-motion a looping clip becomes its poster frame.
     * With no poster to fall back to the video is still rendered, but given
     * controls and left paused, so the content stays reachable without
     * anything moving on its own.
     */
    const buildMediaElement = (m, opts) => {
        if (m.type === 'image') return buildImage(m, opts);

        if (reduceMotion.matches) {
            if (hasText(m.poster)) {
                const o = Object.assign({}, opts, { src: m.poster });
                return buildImage(m, o);
            }
            const video = buildVideo(m);
            delete video.dataset.autoplayInView;
            video.controls = true;
            video.preload = 'metadata';
            video.removeAttribute('aria-hidden');
            video.tabIndex = 0;
            return video;
        }

        return buildVideo(m);
    };

    /* ---------- home page cards ---------- */

    const featuredConfig = siteMedia.featured || {};

    for (const card of document.querySelectorAll('.feature[data-project]')) {
        const m = featuredConfig[card.dataset.project];
        if (!isValidMedia(m)) continue;

        // span, not div: the other children of the anchor are spans, so this
        // keeps one consistent inline-level content model inside the link
        const wrap = document.createElement('span');
        wrap.className = 'feature-media';
        wrap.appendChild(buildMediaElement(m));
        card.insertBefore(wrap, card.firstChild);
        card.classList.add('has-media');
    }

    /* ---------- project pages ---------- */

    const page = document.querySelector('.project-page[data-project]');

    if (page) {
        const config = (siteMedia.projects || {})[page.dataset.project] || {};
        const slot = page.querySelector('[data-media-slot]');

        if (slot) {
            const buildFigure = (m, opts) => {
                const figure = document.createElement('figure');
                figure.appendChild(buildMediaElement(m, opts));
                if (hasText(m.caption)) {
                    const cap = document.createElement('figcaption');
                    cap.textContent = m.caption;
                    figure.appendChild(cap);
                }
                return figure;
            };

            // the lead image sits above the fold, so it is the one piece of
            // media that must not be lazy loaded
            if (isValidMedia(config.hero)) {
                const hero = buildFigure(config.hero, { eager: true });
                hero.className = 'project-media';
                slot.appendChild(hero);
            }

            const items = Array.isArray(config.gallery)
                ? config.gallery.filter(isValidMedia)
                : [];

            if (items.length) {
                const gallery = document.createElement('div');
                gallery.className = 'project-gallery';
                for (const m of items) {
                    const figure = buildFigure(m);
                    if (m.span === 'full') figure.classList.add('span-full');
                    gallery.appendChild(figure);
                }
                slot.appendChild(gallery);
            }
        }
    }

    /* ---------- play only what is on screen ---------- */

    /*
     * Anything offscreen is paused, and anything in a hidden tab is paused,
     * so no decoding work happens for a clip nobody is looking at.
     */
    const clips = [...document.querySelectorAll('video[data-autoplay-in-view]')];

    if (clips.length) {
        const visible = new Set();

        const syncClips = () => {
            for (const clip of clips) {
                if (visible.has(clip) && !document.hidden) {
                    // play() rejects if the browser blocks it; nothing to do
                    // but carry on, the poster simply stays put
                    const played = clip.play();
                    if (played && played.catch) played.catch(() => {});
                } else if (!clip.paused) {
                    clip.pause();
                }
            }
        };

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target);
                    else visible.delete(entry.target);
                }
                syncClips();
            }, { rootMargin: '10% 0px', threshold: 0.15 });

            clips.forEach((clip) => io.observe(clip));
        } else {
            clips.forEach((clip) => visible.add(clip));
            syncClips();
        }

        document.addEventListener('visibilitychange', syncClips);
    }
}


/* ==========================================================================
 * HERO COMETS
 *
 * A restrained reimplementation of the comet idea from the Particle World
 * sketch — written directly against canvas 2d rather than importing p5, and
 * cut down to a handful of slow, dim, monochrome streaks so it reads as
 * texture behind the headline rather than as animation competing with it.
 *
 * TO DISABLE: remove `has-comets` from the hero element in index.html.
 * No canvas is created and this whole block exits immediately.
 *
 * TO TUNE: the COMETS object below. `maxAlpha` is the one to lower if the
 * effect ever feels loud.
 * ======================================================================== */

const COMETS = {
    count: 14,           // desktop
    countNarrow: 7,      // below tabletWidth
    disableBelow: 768,   // viewport px; at or under this there are no comets
    tabletWidth: 1100,

    /*
     * One shared heading for every comet — they fall as a single field rather
     * than scattering, the way a meteor shower reads from the ground.
     * 0.22π is about 40° below horizontal, travelling down and to the right.
     */
    angle: Math.PI * 0.22,

    /*
     * Depth. Each comet is assigned a value from 0 (far) to 1 (near), and
     * every property below is interpolated between its far and near end from
     * that single number. Size alone would look like arbitrary line weights;
     * moving size, speed, tail length and brightness together is what makes
     * the big ones read as closer rather than merely thicker.
     */
    sizeFar: 0.45,
    sizeNear: 1.9,
    speedFar: 0.07,
    speedNear: 0.38,
    tailFar: 28,
    tailNear: 130,
    alphaFar: 0.05,
    // ceiling on a comet's opacity, reached only by the nearest ones. At 0.22
    // the brightest pixel a comet can put behind the headline still leaves the
    // text above 10:1 contrast, so the effect cannot push type out of WCAG
    // range however the comets land.
    alphaNear: 0.22,

    /*
     * Independent speed variation on top of depth. Without this every comet
     * at a given size moves at exactly one speed and the field looks
     * mechanical; this lets two comets the same size still travel at
     * noticeably different rates, so some clearly outrun others.
     */
    speedJitterMin: 0.65,
    speedJitterMax: 1.45,

    colour: '242, 242, 242'
};

const heroWithComets = document.querySelector('.hero.has-comets');

if (heroWithComets && !reduceMotion.matches && window.innerWidth > COMETS.disableBelow) {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-comet-canvas';
    // decorative only: out of the a11y tree, and pointer-events:none in CSS
    // so it can never swallow a click meant for the hero buttons
    canvas.setAttribute('aria-hidden', 'true');
    heroWithComets.insertBefore(canvas, heroWithComets.firstChild);

    const ctx = canvas.getContext('2d');
    let comets = [];
    let cometWidth = 0;
    let cometHeight = 0;
    let cometFrame = null;
    let heroOnScreen = true;

    const rand = (min, max) => min + Math.random() * (max - min);

    const lerp = (a, b, t) => a + (b - a) * t;

    // shared heading, so the whole field falls on one inclination
    const dirX = Math.cos(COMETS.angle);
    const dirY = Math.sin(COMETS.angle);

    const seed = (comet, fresh) => {
        /*
         * One depth value drives everything. Squaring the random keeps most
         * comets toward the far end, so the near, bright, fast ones stay
         * occasional — a field of uniformly close comets would be loud.
         */
        const depth = Math.pow(Math.random(), 2);

        const speed = lerp(COMETS.speedFar, COMETS.speedNear, depth)
            * rand(COMETS.speedJitterMin, COMETS.speedJitterMax);

        comet.vx = dirX * speed;
        comet.vy = dirY * speed;
        comet.tail = lerp(COMETS.tailFar, COMETS.tailNear, depth);
        comet.alpha = lerp(COMETS.alphaFar, COMETS.alphaNear, depth);
        comet.size = lerp(COMETS.sizeFar, COMETS.sizeNear, depth);

        if (fresh) {
            comet.x = rand(0, cometWidth);
            comet.y = rand(0, cometHeight);
        } else {
            /*
             * Re-enter from the top or left edge, matching travel direction.
             * The margin is the longest tail any comet can have, so one never
             * appears already part-way across the hero.
             */
            const margin = COMETS.tailNear;
            if (Math.random() < 0.5) {
                comet.x = rand(-margin, cometWidth);
                comet.y = -margin;
            } else {
                comet.x = -margin;
                comet.y = rand(-margin, cometHeight);
            }
        }
        return comet;
    };

    /*
     * The disableBelow check also lives here, not just at start-up: a desktop
     * window dragged narrow would otherwise keep painting comets at a width
     * where a phone would never have been given any.
     */
    const populate = () => {
        let count = COMETS.count;
        if (window.innerWidth <= COMETS.disableBelow) count = 0;
        else if (window.innerWidth < COMETS.tabletWidth) count = COMETS.countNarrow;
        comets = Array.from({ length: count }, () => seed({}, true));
    };

    const resizeComets = () => {
        const rect = heroWithComets.getBoundingClientRect();
        // cap the backing store at 2x; past that costs fill rate for no
        // visible gain on an effect this faint
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cometWidth = rect.width;
        cometHeight = rect.height;
        canvas.width = Math.round(cometWidth * dpr);
        canvas.height = Math.round(cometHeight * dpr);
        canvas.style.width = cometWidth + 'px';
        canvas.style.height = cometHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        populate();
    };

    const drawComets = () => {
        ctx.clearRect(0, 0, cometWidth, cometHeight);

        for (const c of comets) {
            c.x += c.vx;
            c.y += c.vy;

            if (c.x - c.tail > cometWidth || c.y - c.tail > cometHeight) seed(c, false);

            /*
             * Every comet shares one heading, so the tail is just the unit
             * direction scaled by this comet's length. The earlier version
             * normalised each velocity here, which divided by speed on every
             * comet every frame — needless now, and it was the division that
             * could hand createLinearGradient a non-finite value.
             */
            const tailX = c.x - dirX * c.tail;
            const tailY = c.y - dirY * c.tail;

            const gradient = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
            gradient.addColorStop(0, 'rgba(' + COMETS.colour + ', ' + c.alpha + ')');
            gradient.addColorStop(1, 'rgba(' + COMETS.colour + ', 0)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = c.size;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
        }

        cometFrame = requestAnimationFrame(drawComets);
    };

    const startComets = () => {
        if (cometFrame === null) cometFrame = requestAnimationFrame(drawComets);
    };

    const stopComets = () => {
        if (cometFrame !== null) {
            cancelAnimationFrame(cometFrame);
            cometFrame = null;
        }
    };

    // no work at all while the hero is scrolled away or the tab is in the
    // background: the loop is cancelled, not merely skipped
    const syncComets = () => {
        if (heroOnScreen && !document.hidden) startComets();
        else stopComets();
    };

    resizeComets();
    window.addEventListener('resize', resizeComets);
    document.addEventListener('visibilitychange', syncComets);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            heroOnScreen = entries[0].isIntersecting;
            syncComets();
        }, { threshold: 0 }).observe(heroWithComets);
    }

    // reduced motion can be switched on while the page is already open
    if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener('change', (e) => {
            if (!e.matches) return;
            stopComets();
            window.removeEventListener('resize', resizeComets);
            document.removeEventListener('visibilitychange', syncComets);
            canvas.remove();
        });
    }

    syncComets();
}
