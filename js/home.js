/*
 * HOMEPAGE BEHAVIOUR. Loaded only by index.html, before js/site.js so the
 * cards and the portrait exist by the time the reveal observer runs.
 *
 * Card parallax, the magnetic title and its wave, the typewriter, the hero
 * director that sequences them, the View Work float, the comet canvas, and
 * the card and portrait media rendered from window.SITE_MEDIA.
 */
(function () {
    'use strict';

    /* Featured-card interaction */

    /*
     * Each card drifts against the cursor by an amount set by its data-depth, on top
     * of the static rotation it already carries in CSS.
     */
    const featured = document.getElementById('featured');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    if (featured && !reduceMotion.matches && !coarsePointer.matches) {
        const cards = [...featured.querySelectorAll('.feature')].map((card) => ({
            el: card,
            depth: Number(card.dataset.depth) || 1
        }));

        let frame = null;

        featured.addEventListener('mousemove', (event) => {
            if (frame) return;

            frame = requestAnimationFrame(() => {
                frame = null;
                const bounds = featured.getBoundingClientRect();
                const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
                const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

                for (const { el, depth } of cards) {
                    /*
                     * Two variables, not a transform. .feature composes these with
                     * the card's tilt and with the scroll reveal, so the drift no
                     * longer has to carry the tilt along with it — and cannot
                     * flatten a reveal that is still in flight.
                     */
                    el.style.setProperty('--drift-x', `${-offsetX * depth * 16}px`);
                    el.style.setProperty('--drift-y', `${-offsetY * depth * 16}px`);
                }
            });
        });

        featured.addEventListener('mouseleave', () => {
            for (const { el } of cards) {
                el.style.removeProperty('--drift-x');
                el.style.removeProperty('--drift-y');
            }
        });
    }

    /* The hero stage */
    const heroStage = {
        wave: null,     // { run(alive), stop() }
        type: null,     // { typeIn(alive), deleteOut(alive), advance(), setStill(), stop() }
        bob: null       // { arm(), disarm() }
    };


    /* Hero interactions: magnetic title */

    /*
     * Splits the text content of any .magnetic-text element into one span per
     * character at runtime — the HTML source stays plain, editable text.
     */
    const magneticRoots = document.querySelectorAll('.magnetic-text');

    if (magneticRoots.length && !reduceMotion.matches && !coarsePointer.matches) {
        const RADIUS = 84;
        const MAX_LIFT = 15;

        /*
         * The wave. STEP is the gap between one letter starting and the next;
         * WORD_GAP is added again at every space.
         */
        const WAVE_STEP = 58;
        const WAVE_WORD_GAP = 100;
        const WAVE_DURATION = 700;
        const WAVE_FIRST = 1500;
        const WAVE_EVERY = 15000;

        const letters = [];
        let points = [];

        let ready = false;
        let frame = null;
        let pending = null;          // newest pointer position, document coords
        let measureQueued = false;

        /* The letters own --letter-lift, and nothing else writes to it. */
        const rest = () => {
            for (const el of letters) el.style.removeProperty('--letter-lift');
        };

        /*
         * Read the resting layout, not wherever the cursor has pushed a letter.
         * .is-measuring drops both the displacement and its transition for the
         * length of the read, so a measure taken mid-interaction lands on the same
         * numbers as one taken at rest.
         */
        const measure = () => {
            measureQueued = false;
            const sx = window.scrollX;
            const sy = window.scrollY;

            for (const root of magneticRoots) root.classList.add('is-measuring');

            points = letters.map((el) => {
                const rect = el.getBoundingClientRect();
                return {
                    el,
                    cx: rect.left + sx + rect.width / 2,
                    cy: rect.top + sy + rect.height / 2
                };
            });

            for (const root of magneticRoots) root.classList.remove('is-measuring');
        };

        // resize fires in bursts; one measure per frame is enough
        const remeasure = () => {
            if (measureQueued) return;
            measureQueued = true;
            requestAnimationFrame(measure);
        };

        /*
         * animationend tells us the reveal has finished and the letters are where
         * they will stay — but it is not a signal that always arrives.
         */
        let pendingLines = 0;
        let settledLines = 0;

        const onLineSettled = () => {
            settledLines++;
            measure();
            if (settledLines >= pendingLines) ready = true;
        };

        /*
         * One running offset across every line of the title, so the wave crosses a
         * line break as one continuous sweep instead of restarting three times.
         */
        let waveOffset = 0;

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

                    if (wordIndex > 0 || waveOffset > 0) waveOffset += WAVE_WORD_GAP;

                    for (const char of word) {
                        const letterSpan = document.createElement('span');
                        letterSpan.className = 'letter';
                        letterSpan.textContent = char;
                        letterSpan.style.setProperty('--wave-delay', `${waveOffset}ms`);
                        waveOffset += WAVE_STEP;
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
                let settled = false;

                const settle = () => {
                    if (settled) return;
                    settled = true;
                    if (mask) mask.style.overflow = 'visible';
                    onLineSettled();
                };

                if (getComputedStyle(line).animationName === 'none') {
                    settle();
                } else {
                    line.addEventListener('animationend', settle, { once: true });
                    line.addEventListener('animationcancel', settle, { once: true });
                    // 0.7s of reveal plus 140ms of stagger; a second is past it
                    setTimeout(settle, 1000);
                }
            }
        }

        const apply = () => {
            frame = null;
            if (!pending) return;

            const { x, y } = pending;

            for (const { el, cx, cy } of points) {
                const distance = Math.hypot(cx - x, cy - y);

                if (distance >= RADIUS) {
                    el.style.removeProperty('--letter-lift');
                    continue;
                }

                /*
                 * Lift straight up rather than pushing radially away. A radial push
                 * scatters letters in every direction at once and reads as noise on
                 * a line of text; a vertical hop keeps the baseline legible and
                 * reads as the cursor sweeping letters up as it passes.
                 */
                const strength = (1 - distance / RADIUS) ** 2;
                el.style.setProperty('--letter-lift', `${-strength * MAX_LIFT}px`);
            }
        };

        /*
         * One frame in flight at a time, and it always renders the NEWEST pointer
         * position rather than the one that happened to open the window — the old
         * guard returned early and threw away every later move in the frame, so a
         * fast sweep lagged the cursor by up to 16ms of stale input.
         */
        const schedule = () => {
            if (frame !== null) return;
            frame = requestAnimationFrame(apply);
        };

        document.addEventListener('pointermove', (event) => {
            // a pen or a finger is not a cursor to steer away from, and someone
            // who turned motion off mid-session should stop being followed
            if (!ready || event.pointerType !== 'mouse' || reduceMotion.matches) return;
            pending = { x: event.clientX + window.scrollX, y: event.clientY + window.scrollY };
            schedule();
        });

        /* Letting go. */
        const release = () => {
            pending = null;
            if (frame !== null) {
                cancelAnimationFrame(frame);
                frame = null;
            }
            rest();
        };

        document.addEventListener('pointerleave', release);
        window.addEventListener('blur', release);

        /*
         * THE WAVE, AS SOMETHING THE DIRECTOR CAN ASK FOR No cadence here and no
         * timer of its own beyond the one that takes the class off at the end of a
         * sweep. run() resolves when the last letter is home, which is what lets the
         * director say "wave, then wait, then type" in a straight line instead of
         * guessing durations.
         */
        let waveEnd = null;
        // the whole sweep: the last letter's delay plus its own travel
        const waveSpan = waveOffset - WAVE_STEP + WAVE_DURATION;

        const stopWave = () => {
            clearTimeout(waveEnd);
            waveEnd = null;
            for (const root of magneticRoots) root.classList.remove('is-waving');
        };

        heroStage.wave = {
            span: waveSpan,
            stop: stopWave,
            run: (alive) => new Promise((resolve) => {
                for (const root of magneticRoots) {
                    /*
                     * Off, reflow, on. Re-adding a class the element already has
                     * does not restart a CSS animation; taking it off and forcing
                     * the style to be recomputed in between does. offsetWidth is
                     * read for that flush and nothing else.
                     */
                    root.classList.remove('is-waving');
                    void root.offsetWidth;
                    root.classList.add('is-waving');
                }

                waveEnd = setTimeout(() => {
                    waveEnd = null;
                    for (const root of magneticRoots) root.classList.remove('is-waving');
                    resolve(alive());
                }, waveSpan + 120);
            })
        };

        window.addEventListener('resize', remeasure);

        /*
         * The display face is loaded async with font-display: swap, so it can land
         * after the reveal finishes.
         */
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(remeasure);
        }

        /* Coming back to the page. */
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) ready = true;
            release();
            remeasure();
        });

        // returning to a background tab: layout may have changed under it, and
        // a lift left mid-transition should not survive the trip
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) return;
            release();
            remeasure();
        });
    }


    /* Hero interactions: typing line */

    /*
     * Two phrases on the small line above the hero title. Scoped to
     * [data-typewriter] so it can only ever touch the one element that opts in —
     * .eyebrow is also the label on every category page and none of those should
     * start typing.
     */
    const typewriter = document.querySelector('[data-typewriter]');

    if (typewriter) {
        const out = typewriter.querySelector('.typewriter-text');
        const caret = typewriter.querySelector('.typewriter-caret');

        const PHRASES = ['hi, i\u2019m isaac', 'welcome to my portfolio...'];
        // what the line says when it is not allowed to move: both phrases, at
        // once, which is what the animation would have said over time
        const STILL = 'hi, i\u2019m isaac welcome to my portfolio...';
        const TYPE = 100;       // per character
        const DELETE = 62;      // deleting reads as faster than writing

        let phrase = 0;
        let timer = null;

        const stop = () => {
            clearTimeout(timer);
            timer = null;
        };

        /*
         * Walk the visible text towards a target length, one character per tick, and
         * resolve when it arrives.
         */
        const walk = (target, per, alive) => new Promise((resolve) => {
            const text = PHRASES[phrase];

            const stepOnce = () => {
                if (!alive()) {
                    resolve(false);
                    return;
                }

                const n = out.textContent.length;

                if (n === target) {
                    resolve(true);
                    return;
                }

                out.textContent = text.slice(0, n + (n < target ? 1 : -1));
                timer = setTimeout(stepOnce, per);
            };

            stepOnce();
        });

        heroStage.type = {
            typeIn: (alive) => walk(PHRASES[phrase].length, TYPE, alive),
            deleteOut: (alive) => walk(0, DELETE, alive),
            advance: () => { phrase = (phrase + 1) % PHRASES.length; },
            stop,

            // the resting state for anyone who asked not to be moved
            setStill: () => {
                stop();
                out.textContent = STILL;
                if (caret) caret.style.display = 'none';
            },

            // start of a run: the line is emptied so the first phrase types in
            // rather than appearing already finished. The markup ships holding
            // that phrase, so with no JavaScript at all it simply stays there.
            clear: () => {
                stop();
                phrase = 0;
                out.textContent = '';
                if (caret) caret.style.display = '';
            }
        };
    }


    /* Hero interactions: director */

    /* WHO MOVES, AND WHEN. The rule is that the hero says one thing at a time. */
    const heroDirector = () => {
        const hero = document.querySelector('.hero');
        if (!hero || (!heroStage.type && !heroStage.wave)) return null;

        const ARRIVE = 600;      // before the first character
        const QUIET = 1350;      // stillness between any two effects
        const HOLD = 5000;       // a finished phrase stays at least this long
        const CADENCE = 15000;   // wave start to wave start, when it can be met
        const FLOAT_IN = 3000;   // before the button starts moving

        let token = 0;
        let timer = null;
        // the float's own handle: it runs beside the sequence rather than inside
        // it, so it cannot share the one the await-chain uses
        let floatTimer = null;

        const wait = (ms, alive) => new Promise((resolve) => {
            timer = setTimeout(() => {
                timer = null;
                resolve(alive());
            }, ms);
        });

        const stop = () => {
            token++;
            clearTimeout(timer);
            clearTimeout(floatTimer);
            timer = null;
            floatTimer = null;
            if (heroStage.type) heroStage.type.stop();
            if (heroStage.wave) heroStage.wave.stop();
            if (heroStage.bob) heroStage.bob.disarm();
        };

        const run = async () => {
            stop();

            if (reduceMotion.matches) {
                // everything visible, nothing moving
                if (heroStage.type) heroStage.type.setStill();
                return;
            }

            if (document.hidden) return;

            const mine = ++token;
            const alive = () => mine === token;

            /*
             * The float keeps its own three seconds and is not part of the sequence
             * below.
             */
            floatTimer = setTimeout(() => {
                floatTimer = null;
                if (alive() && heroStage.bob) heroStage.bob.arm();
            }, FLOAT_IN);

            if (heroStage.type) heroStage.type.clear();

            if (!await wait(ARRIVE, alive)) return;

            let lastWave = 0;
            let first = true;

            while (alive()) {
                if (heroStage.type && !await heroStage.type.typeIn(alive)) return;

                if (!await wait(QUIET, alive)) return;

                if (heroStage.wave) {
                    /*
                     * The wave aims for one start every fifteen seconds, but it is a
                     * target rather than a deadline: it will never cut into typing
                     * to hit it, and the extra stillness that waiting produces is
                     * the point rather than a cost.
                     */
                    const due = lastWave + CADENCE - performance.now();
                    if (!first && due > 0 && !await wait(due, alive)) return;

                    lastWave = performance.now();
                    if (!await heroStage.wave.run(alive)) return;

                    if (!await wait(QUIET, alive)) return;
                }

                /*
                 * The buffers and the sweep have already held the finished phrase
                 * for QUIET + span + QUIET.
                 */
                if (heroStage.wave) {
                    const held = QUIET * 2 + heroStage.wave.span;
                    if (held < HOLD && !await wait(HOLD - held, alive)) return;
                } else if (!await wait(HOLD, alive)) {
                    return;
                }

                first = false;

                if (heroStage.type) {
                    if (!await heroStage.type.deleteOut(alive)) return;
                    heroStage.type.advance();
                    if (!await wait(400, alive)) return;
                }
            }
        };

        return { run, stop };
    };

    const heroShow = heroDirector();

    if (heroShow) {
        heroShow.run();

        // every genuine arrival restarts the sequence from the top, and stop()
        // inside run() guarantees the previous one is already dead
        window.addEventListener('pageshow', heroShow.run);
        window.addEventListener('pagehide', heroShow.stop);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) heroShow.stop();
            else heroShow.run();
        });

        reduceMotion.addEventListener('change', heroShow.run);
    }


    /* Hero interactions: View Work float */

    /*
     * The primary action hovers, continuously, by five pixels. Get in touch does
     * not, which is the whole point: two buttons that both moved would rank neither.
     */
    const heroFloat = document.querySelector('.hero-actions .button:not(.button-ghost)');

    if (heroFloat) {
        heroStage.bob = {
            arm: () => {
                if (reduceMotion.matches) return;
                heroFloat.classList.add('is-floating');
            },
            disarm: () => heroFloat.classList.remove('is-floating')
        };
    }

    /* Project media rendering */

    const siteMedia = window.SITE_MEDIA || null;

    if (siteMedia) {
        /*
         * These builders are duplicated in the sibling page script.
         * Nothing loads before both files — site.js loads after them and
         * media.js is data — and a page is either the homepage or a
         * project page, so only one copy is ever parsed. Keep them in step.
         */
        const resolveURL = (path) => new URL(path, siteMedia.baseURL).href;

        const hasText = (v) => typeof v === 'string' && v.trim() !== '';

        /*
         * A config entry only counts as real if it can actually produce a rendered
         * element.
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

            /*
             * Upright media gets flagged so CSS can cap its width. A landscape lead
             * image run across the full measure is a hero; the same rule applied to
             * a 3:4 photograph is 1400px of vertical scroll for one picture, and to
             * a 9:16 phone clip it is worse.
             */
            if (Number(m.height) > Number(m.width)) el.classList.add('is-portrait');
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

            /*
             * Optional responsive set. Skipped when the caller has overridden the
             * source — that only happens for a video's poster frame under reduced
             * motion, and the set describes the video, not the still.
             */
            if (!o.src && Array.isArray(m.srcset)) {
                const set = m.srcset
                    .filter((s) => hasText(s && s.src))
                    .map((s) => resolveURL(s.src) + (hasText(s.descriptor) ? ' ' + s.descriptor.trim() : ''))
                    .join(', ');

                if (set) {
                    img.srcset = set;
                    if (hasText(m.sizes)) img.sizes = m.sizes;
                }
            }

            applyBox(img, m);
            return img;
        };

        /*
         * VIDEO MODES. preview a short silent loop used as imagery — a card loop, a
         * few seconds of a machine running.
         */
        const videoMode = (m) => (m.mode === 'player' ? 'player' : 'preview');

        const attachSources = (video, m) => {
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
        };

        /*
         * Preview. Never carries the autoplay attribute — playback is driven by the
         * IntersectionObserver below, so a clip that is never scrolled to is never
         * fetched and never decoded.
         */
        const buildPreviewVideo = (m) => {
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

            attachSources(video, m);
            applyBox(video, m);
            video.dataset.autoplayInView = 'true';
            return video;
        };

        /*
         * Player. Deliberately the opposite of the preview in every respect that
         * matters: it waits to be asked.
         */
        const buildPlayerVideo = (m) => {
            const video = document.createElement('video');
            video.controls = true;
            video.loop = false;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.preload = 'metadata';
            if (hasText(m.poster)) video.poster = resolveURL(m.poster);

            // controls make it focusable already; this only names it, so a
            // screen reader says what the film is rather than "video"
            const label = hasText(m.alt) ? m.alt : m.caption;
            if (hasText(label)) video.setAttribute('aria-label', label);

            attachSources(video, m);
            applyBox(video, m);
            return video;
        };

        /*
         * Reduced motion applies to the preview only. A player never moves until it
         * is asked to, so there is nothing to reduce — silently swapping a film
         * someone chose to watch for a still would be the bug, not the fix.
         */
        const buildMediaElement = (m, opts) => {
            if (m.type === 'image') return buildImage(m, opts);

            if (videoMode(m) === 'player') return buildPlayerVideo(m);

            if (reduceMotion.matches) {
                if (hasText(m.poster)) {
                    const o = Object.assign({}, opts, { src: m.poster });
                    return buildImage(m, o);
                }
                const video = buildPreviewVideo(m);
                delete video.dataset.autoplayInView;
                video.controls = true;
                video.preload = 'metadata';
                video.removeAttribute('aria-hidden');
                video.tabIndex = 0;
                return video;
            }

            return buildPreviewVideo(m);
        };
        /* ---------- home page cards ---------- */

        const featuredConfig = siteMedia.featured || {};

        for (const card of document.querySelectorAll('.feature[data-project]')) {
            const m = featuredConfig[card.dataset.project];
            if (!isValidMedia(m)) continue;

            /*
             * A card is entirely one link, so its media can only ever be a preview.
             * Native controls inside an anchor are interactive content nested in a
             * link — invalid markup, and in practice a keyboard trap where the play
             * button and the card fight over the same Enter press.
             */
            const forPreview = m.mode === 'player' ? Object.assign({}, m, { mode: 'preview' }) : m;

            // span, not div: the other children of the anchor are spans, so this
            // keeps one consistent inline-level content model inside the link
            const wrap = document.createElement('span');
            wrap.className = 'feature-media';
            wrap.appendChild(buildMediaElement(forPreview));
            card.insertBefore(wrap, card.firstChild);
            card.classList.add('has-media');
        }

        /* ---------- about portrait ---------- */

        /*
         * Inserted rather than filled in: an empty slot element would still be a
         * grid item and would still hold a column open, which is the one thing the
         * About section must not do while there is no photograph.
         */
        const aboutGrid = document.querySelector('.about-grid');
        const aboutSide = aboutGrid && aboutGrid.querySelector('.about-side');
        const portrait = siteMedia.portrait;

        if (aboutGrid && aboutSide && portrait && portrait.type === 'image' && isValidMedia(portrait)) {
            const figure = document.createElement('figure');
            figure.className = 'about-portrait';
            /*
             * One reveal for the photograph, set here rather than in the markup
             * because the figure does not exist until this runs.
             */
            figure.setAttribute('data-reveal', '');
            figure.appendChild(buildImage(portrait));

            // between the introduction and the capabilities, so the rendered
            // order matches the reading order at every width
            aboutGrid.insertBefore(figure, aboutSide);
            aboutGrid.classList.add('has-portrait');
        }
        /* ---------- play only what is on screen ---------- */

        /*
         * Anything offscreen is paused, and anything in a hidden tab is paused, so
         * no decoding work happens for a clip nobody is looking at.
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
                        if (played && played.catch) played.catch(() => { });
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


    /* Decorative canvas */

    const COMETS = {
        count: 14,           // desktop
        countNarrow: 7,      // below tabletWidth
        disableBelow: 768,   // viewport px; at or under this there are no comets
        tabletWidth: 1100,

        /*
         * One shared heading for every comet — they fall as a single field rather
         * than scattering, the way a meteor shower reads from the ground. 0.22π is
         * about 40° below horizontal, travelling down and to the right.
         */
        angle: Math.PI * 0.22,

        /*
         * Depth. Each comet is assigned a value from 0 (far) to 1 (near), and every
         * property below is interpolated between its far and near end from that
         * single number.
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
         * Independent speed variation on top of depth. Without this every comet at a
         * given size moves at exactly one speed and the field looks mechanical; this
         * lets two comets the same size still travel at noticeably different rates,
         * so some clearly outrun others.
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
                /* Re-enter from the top or left edge, matching travel direction. */
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
                 * direction scaled by this comet's length.
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

}());
