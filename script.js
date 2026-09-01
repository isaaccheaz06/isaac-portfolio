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
                 * Two variables, not a transform. .feature composes these
                 * with the card's tilt and with the scroll reveal, so the
                 * drift no longer has to carry the tilt along with it — and
                 * cannot flatten a reveal that is still in flight.
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

/* ==========================================================================
 * THE HERO STAGE
 *
 * Three things move in the hero and none of them may move at the same time
 * as another: the line that types itself, the wave that crosses the title,
 * and the small bob under View Work. Left to their own timers they were
 * three animations competing for one pair of eyes — the wave arriving
 * halfway through a word being deleted, the button nodding under both.
 *
 * So none of them owns a schedule any more. Each registers what it can DO
 * on this object, and the director at the bottom of the file decides when.
 * That is also what makes the whole hero idempotent in one place: there is a
 * single token to bump and a single timer to clear, however many effects are
 * eventually hung off it.
 */
const heroStage = {
    wave: null,     // { run(alive), stop() }
    type: null,     // { typeIn(alive), deleteOut(alive), advance(), setStill(), stop() }
    bob: null       // { arm(), disarm() }
};


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

    /*
     * The wave.
     *
     * STEP is the gap between one letter starting and the next; WORD_GAP is
     * added again at every space. Without it the wave crosses a space at the
     * same rate it crosses a letter, which reads as a machine sweeping a
     * string rather than as something travelling through a sentence — the
     * pause at a word boundary is what makes it feel like reading.
     *
     * 46 gaps at 58ms plus 9 word boundaries at 100ms puts the last letter
     * 3.57s behind the first, and its own 0.7s of travel closes the wave at
     * about 4.3s — slow enough that the pulse reads as one thing crossing
     * the sentence rather than as a shimmer over all of it at once.
     *
     * The sweep is comfortably shorter than EVERY, so a wave has always
     * finished and cleared before the next is armed; runWave() takes the
     * class off at waveSpan and does not put it back until 15s.
     *
     * EVERY is measured start-to-start, so the title is still for roughly
     * twelve of the fifteen seconds.
     */
    const WAVE_STEP = 58;
    const WAVE_WORD_GAP = 100;
    const WAVE_DURATION = 700;
    const WAVE_FIRST = 1500;
    const WAVE_EVERY = 15000;

    /*
     * Two coordinate systems used to be one, and that was the bug.
     *
     * `points` caches a centre per letter so the pointer handler is not
     * calling getBoundingClientRect 47 times a frame. It used to cache
     * getBoundingClientRect's own output, which is VIEWPORT-relative, and
     * refresh it on resize and on fonts.ready only — never on scroll. So the
     * hot zone stayed wherever the page happened to be scrolled the last
     * time measure() ran, and every scroll moved the letters out from under
     * it. Measured: with the page scrolled 1574px, hovering a letter did
     * nothing and hovering 1574px below it lifted six.
     *
     * That is what made Back navigation look like the trigger. Coming back,
     * the browser restores the previous scroll offset, and measure() runs
     * 0.7s later off the reveal animation — by then at the restored offset.
     * The centres are cached against that, so scrolling up to the title
     * leaves the hot zone a screen and a half below it, and the effect is
     * dead for the life of the page: nothing re-measures except a resize,
     * which is exactly why resizing the window "fixed" it.
     *
     * Document coordinates instead. A letter's document position does not
     * change when the page scrolls, so the cache stays true and there is no
     * scroll listener to throttle — the pointer is converted on the way in
     * rather than 47 centres being converted on the way out.
     */
    const letters = [];
    let points = [];

    let ready = false;
    let frame = null;
    let pending = null;          // newest pointer position, document coords
    let measureQueued = false;

    /*
     * The letters own --letter-lift, and nothing else writes to it.
     *
     * The lift used to be written straight to el.style.transform, which made
     * `transform` on .letter a shared resource: anything else that wanted to
     * transform a letter — a scroll reveal, most obviously — would silently
     * erase the lift, or be erased by it, depending on which wrote last.
     * A custom property cannot collide that way. The CSS composes it into
     * transform, and the transition on .letter still runs because the
     * computed transform changes when the variable does.
     */
    const rest = () => {
        for (const el of letters) el.style.removeProperty('--letter-lift');
    };

    /*
     * Read the resting layout, not wherever the cursor has pushed a letter.
     * .is-measuring drops both the displacement and its transition for the
     * length of the read, so a measure taken mid-interaction lands on the
     * same numbers as one taken at rest.
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
     * animationend tells us the reveal has finished and the letters are
     * where they will stay — but it is not a signal that always arrives. An
     * animation that is interrupted fires animationcancel instead, and one
     * that never starts fires nothing, and in either case `ready` would
     * stick at false and the effect would be dead with no way back. So:
     * whichever of the three arrives first settles the line, and the timeout
     * guarantees there is a third.
     */
    let pendingLines = 0;
    let settledLines = 0;

    const onLineSettled = () => {
        settledLines++;
        measure();
        if (settledLines >= pendingLines) ready = true;
    };

    /*
     * One running offset across every line of the title, so the wave crosses
     * a line break as one continuous sweep instead of restarting three
     * times. Set once here as an inline custom property and never touched
     * again — the animation reads it as its delay.
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
             * Lift straight up rather than pushing radially away. A radial
             * push scatters letters in every direction at once and reads as
             * noise on a line of text; a vertical hop keeps the baseline
             * legible and reads as the cursor sweeping letters up as it
             * passes. Quadratic falloff so only letters genuinely near the
             * cursor move much.
             */
            const strength = (1 - distance / RADIUS) ** 2;
            el.style.setProperty('--letter-lift', `${-strength * MAX_LIFT}px`);
        }
    };

    /*
     * One frame in flight at a time, and it always renders the NEWEST pointer
     * position rather than the one that happened to open the window — the
     * old guard returned early and threw away every later move in the frame,
     * so a fast sweep lagged the cursor by up to 16ms of stale input.
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

    /*
     * Letting go.
     *
     * Distance alone used to be the only way a letter came down, so a cursor
     * that left the window mid-sweep left whatever it was touching held up
     * until the pointer came back. pointerleave on the document fires when
     * the cursor leaves the window entirely; blur covers the tab or window
     * losing focus while the pointer is still inside it. The letters ease
     * home on their own transition rather than snapping — removing the
     * property animates to 0 the same way setting it animates away from it.
     */
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
     * THE WAVE, AS SOMETHING THE DIRECTOR CAN ASK FOR
     *
     * No cadence here and no timer of its own beyond the one that takes the
     * class off at the end of a sweep. run() resolves when the last letter
     * is home, which is what lets the director say "wave, then wait, then
     * type" in a straight line instead of guessing durations.
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
                 * Off, reflow, on. Re-adding a class the element already
                 * has does not restart a CSS animation; taking it off and
                 * forcing the style to be recomputed in between does.
                 * offsetWidth is read for that flush and nothing else.
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
     * The display face is loaded async with font-display: swap, so it can
     * land after the reveal finishes. When it does, every glyph advance
     * changes and the cached centres are silently wrong — letters would then
     * lift while the cursor is nowhere near them.
     */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(remeasure);
    }

    /*
     * Coming back to the page.
     *
     * Restored from the back/forward cache, none of the code above runs
     * again: the listeners, the split letters and the cached centres are all
     * still in the heap exactly as they were left. What is NOT still true is
     * the interaction state — the pointer is wherever it is now, not where
     * it was when the page was navigated away from, and any letter left
     * lifted is still lifted. And if the page was navigated away from during
     * the reveal, `ready` never became true.
     *
     * So this resets rather than re-initialises. It attaches nothing, builds
     * nothing and re-splits nothing, which is what keeps a second visit from
     * ending up with two of every listener.
     */
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


/* ---------- the project-card cursor ---------- */

/*
 * One block, shared by all four cards, that stands in for the pointer while
 * it is over one of them.
 *
 * Delegated to the grid rather than bound per card: three listeners in
 * total, not twelve, and a card added to the markup later is picked up with
 * no change here.
 */
const cardGrid = document.querySelector('.featured');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/*
 * A block that follows the pointer is only meaningful where there IS a
 * pointer to follow, and hiding the real cursor for someone who asked for
 * less motion takes away a thing they rely on to give them a thing they did
 * not ask for. Both cases keep the ordinary cursor and no block is ever
 * built — which is also why the <html> class is set from in here rather
 * than sitting in the markup.
 */
if (cardGrid && finePointer.matches && !reduceMotion.matches
    && !document.querySelector('.card-cursor')) {

    const cursor = document.createElement('div');
    cursor.className = 'card-cursor';
    // decorative: the card's own title and descriptor already say where this
    // link goes, and a screen reader has no pointer for this to follow
    cursor.setAttribute('aria-hidden', 'true');

    const box = document.createElement('span');
    box.className = 'card-cursor-box';
    box.textContent = 'View';
    cursor.appendChild(box);
    document.body.appendChild(cursor);

    /*
     * Beside the pointer, not under it. The system cursor is left alone —
     * it is the thing that says "this is clickable" and it says it in the
     * shape the visitor's own OS taught them — so this sits down and to the
     * right of the arrow's tip, clear of the roughly 12x19px the arrow
     * itself occupies.
     */
    const OFFSET_X = 16;
    const OFFSET_Y = 8;
    const EDGE = 8;

    let x = 0;
    let y = 0;
    let frame = null;
    let shown = false;

    const draw = () => {
        frame = null;

        /*
         * Flipped rather than squashed at an edge. Placing it to the left of
         * the pointer keeps the whole label on screen and keeps the same gap
         * between arrow and box, where clamping would slide the box under
         * the arrow at exactly the moment it is hardest to read.
         *
         * Measured per frame because the box is a fixed 52x29 only until the
         * text or the type size changes; offsetWidth on a fixed, composited
         * element that has already been laid out is a cheap read.
         */
        const w = box.offsetWidth;
        const h = box.offsetHeight;
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;

        let left = x + OFFSET_X;
        let top = y + OFFSET_Y;

        if (left + w > vw - EDGE) left = x - OFFSET_X - w;
        if (top + h > vh - EDGE) top = y - OFFSET_Y - h;

        // and if flipping pushed it off the other side instead, sit still
        // inside the edge rather than off it
        left = Math.max(EDGE, Math.min(left, vw - EDGE - w));
        top = Math.max(EDGE, Math.min(top, vh - EDGE - h));

        cursor.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    };

    // one write per frame however many moves arrive in it, and the write is
    // a transform on a fixed element, so it never touches layout
    const schedule = () => {
        if (frame === null) frame = requestAnimationFrame(draw);
    };

    const show = (event) => {
        x = event.clientX;
        y = event.clientY;

        if (!shown) {
            shown = true;
            // place it before it fades in, or it would scale up from
            // wherever the pointer happened to leave it last time
            draw();
            cursor.classList.add('is-visible');
        }

        schedule();
    };

    const hide = () => {
        if (!shown) return;
        shown = false;
        cursor.classList.remove('is-visible');
        if (frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
        }
    };

    const overCard = (node) => !!(node && node.closest && node.closest('.feature'));

    cardGrid.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        if (overCard(event.target)) show(event);
        else hide();
    });

    // entering without moving again — the page scrolling under a still
    // pointer, or the pointer arriving from outside the window
    cardGrid.addEventListener('pointerover', (event) => {
        if (event.pointerType === 'mouse' && overCard(event.target)) show(event);
    });

    cardGrid.addEventListener('pointerout', (event) => {
        if (!overCard(event.relatedTarget)) hide();
    });

    /*
     * Every way out of the grid that is not a pointer moving off a card.
     * A block left visible after any of these is a block frozen on screen
     * with no cursor near it, which is worse than never showing one.
     */
    cardGrid.addEventListener('pointerleave', hide);
    document.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('pagehide', hide);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) hide();
    });

    // restored from the back/forward cache the block is still in the DOM and
    // may still be wearing .is-visible from before the navigation
    window.addEventListener('pageshow', hide);
}


/* ---------- the typing line ---------- */

/*
 * Two phrases on the small line above the hero title. Scoped to
 * [data-typewriter] so it can only ever touch the one element that opts in —
 * .eyebrow is also the label on every category page and none of those should
 * start typing.
 *
 * This no longer decides WHEN anything happens. It exposes two verbs, each
 * resolving when its own run of characters is finished, and the director
 * below places them around the title wave.
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
     * Walk the visible text towards a target length, one character per
     * tick, and resolve when it arrives. Reading the length off the DOM
     * rather than from a counter is what makes this safe to interrupt:
     * whatever is on screen when a run is cancelled is exactly where the
     * next run starts from, with no separate index to fall out of step.
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


/* ---------- the hero director ---------- */

/*
 * WHO MOVES, AND WHEN.
 *
 * The rule is that the hero says one thing at a time. Typing finishes, the
 * page goes quiet, the title waves, the page goes quiet again, and only then
 * does the line delete itself and write the next phrase. Nothing overlaps,
 * and between any two effects there is at least QUIET of complete stillness —
 * which is the part that makes it read as pacing rather than as activity.
 *
 * Written as one await-chain because that is what the requirement literally
 * is: a sequence. A set of timers that each knew their own interval could
 * express the same intent only as an arithmetic coincidence, and would drift
 * out of it the moment a phrase changed length.
 *
 * Cancellation is a single integer. Every await checks whether the token it
 * started with is still current, so a pageshow or a tab switch simply bumps
 * it and every waiting step in the old run returns instead of resuming. That
 * is the whole of the idempotence: there is no way to have two chains
 * running, because the second one invalidates the first before it starts.
 */
const heroDirector = () => {
    const hero = document.querySelector('.hero');
    if (!hero || (!heroStage.type && !heroStage.wave)) return null;

    const ARRIVE = 600;      // before the first character
    const QUIET = 1350;      // stillness between any two effects
    const HOLD = 5000;       // a finished phrase stays at least this long
    const CADENCE = 15000;   // wave start to wave start, when it can be met

    let token = 0;
    let timer = null;

    const wait = (ms, alive) => new Promise((resolve) => {
        timer = setTimeout(() => {
            timer = null;
            resolve(alive());
        }, ms);
    });

    const stop = () => {
        token++;
        clearTimeout(timer);
        timer = null;
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

        if (heroStage.type) heroStage.type.clear();

        if (!await wait(ARRIVE, alive)) return;

        let lastWave = 0;
        let first = true;

        while (alive()) {
            if (heroStage.type && !await heroStage.type.typeIn(alive)) return;

            if (!await wait(QUIET, alive)) return;

            if (heroStage.wave) {
                /*
                 * The wave aims for one start every fifteen seconds, but it
                 * is a target rather than a deadline: it will never cut into
                 * typing to hit it, and the extra stillness that waiting
                 * produces is the point rather than a cost. The first wave
                 * skips the wait entirely — arriving on the page is its own
                 * starting gun.
                 */
                const due = lastWave + CADENCE - performance.now();
                if (!first && due > 0 && !await wait(due, alive)) return;

                lastWave = performance.now();
                if (!await heroStage.wave.run(alive)) return;

                if (!await wait(QUIET, alive)) return;
            }

            /*
             * The buffers and the sweep have already held the finished
             * phrase for QUIET + span + QUIET. This only waits if that came
             * to less than the five seconds a phrase is owed — so the hold
             * is a floor, not another delay stacked on top of one.
             */
            if (heroStage.wave) {
                const held = QUIET * 2 + heroStage.wave.span;
                if (held < HOLD && !await wait(HOLD - held, alive)) return;
            } else if (!await wait(HOLD, alive)) {
                return;
            }

            // the opening sequence has landed; the button may start nodding
            if (first && heroStage.bob) heroStage.bob.arm();
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


/* ---------- the View Work bob ---------- */

/*
 * The primary action nods, once every five and a half seconds, by three
 * pixels. Get in touch does not, which is the whole point: two buttons that
 * both moved would rank neither.
 *
 * The bob is a custom property rather than a transform, because .button
 * already transforms on hover. Composed in CSS, the two add up; written to
 * the same property they would take turns erasing each other, and a hover
 * that landed mid-bob would drop the button 3px.
 */
const heroBob = document.querySelector('.hero-actions .button:not(.button-ghost)');

if (heroBob) {
    heroStage.bob = {
        arm: () => {
            if (reduceMotion.matches) return;
            heroBob.classList.add('is-bobbing');
        },
        disarm: () => heroBob.classList.remove('is-bobbing')
    };
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

        /*
         * Upright media gets flagged so CSS can cap its width. A landscape
         * lead image run across the full measure is a hero; the same rule
         * applied to a 3:4 photograph is 1400px of vertical scroll for one
         * picture, and to a 9:16 phone clip it is worse.
         *
         * Read from the configured dimensions rather than measured ones so
         * the class is on the element before it lays out — deciding this
         * after the file loads would mean a visible reflow.
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
         *
         * Each candidate is resolved the same way `src` is, so the config can
         * keep writing every path from the site root.
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
     * VIDEO MODES.
     *
     *   preview  a short silent loop used as imagery — a card loop, a few
     *            seconds of a machine running. Muted, looping, no controls,
     *            plays only while on screen.
     *
     *   player   a film someone chooses to watch — a full process film, the
     *            Blender animation. Controls, no autoplay, no loop, audio
     *            allowed, and nothing downloads past the metadata until play
     *            is pressed.
     *
     * A complete film is not wallpaper, and a decorative loop is not a media
     * player. Conflating them either starts audio nobody asked for or buries
     * a ten-minute film behind a silent three-second cut.
     *
     * Entries with no `mode` are treated as previews, which is exactly what
     * this file did before the modes existed.
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
     * Preview. Never carries the autoplay attribute — playback is driven by
     * the IntersectionObserver below, so a clip that is never scrolled to is
     * never fetched and never decoded.
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
     *
     * No autoplayInView flag, so the observer below never touches it — it
     * stays paused when scrolled past and is not stopped mid-sentence when
     * the tab is hidden. preload='metadata' fetches the header only, so a
     * film costs a few kilobytes until someone presses play.
     *
     * It stays in the accessibility tree and keeps native controls, which are
     * keyboard operable as they come: tab to the video, space to play.
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
     * Reduced motion applies to the preview only. A player never moves until
     * it is asked to, so there is nothing to reduce — silently swapping a
     * film someone chose to watch for a still would be the bug, not the fix.
     *
     * A preview becomes its poster frame. With no poster to fall back to the
     * video is still rendered, but given controls and left paused, so the
     * content stays reachable without anything moving on its own.
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
         * A card is entirely one link, so its media can only ever be a
         * preview. Native controls inside an anchor are interactive content
         * nested in a link — invalid markup, and in practice a keyboard trap
         * where the play button and the card fight over the same Enter press.
         * `mode` is therefore ignored here rather than obeyed; a full film
         * belongs on the project page, which is where the card leads.
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
     * grid item and would still hold a column open, which is the one thing
     * the About section must not do while there is no photograph. So the
     * figure and the class that reflows the grid arrive together, or neither
     * does, and the two-column layout in the markup stands on its own.
     *
     * Images only. A portrait is a still by definition, and a looping clip
     * here would pull attention off the work.
     */
    const aboutGrid = document.querySelector('.about-grid');
    const aboutSide = aboutGrid && aboutGrid.querySelector('.about-side');
    const portrait = siteMedia.portrait;

    if (aboutGrid && aboutSide && portrait && portrait.type === 'image' && isValidMedia(portrait)) {
        const figure = document.createElement('figure');
        figure.className = 'about-portrait';
        figure.appendChild(buildImage(portrait));

        // between the introduction and the capabilities, so the rendered
        // order matches the reading order at every width
        aboutGrid.insertBefore(figure, aboutSide);
        aboutGrid.classList.add('has-portrait');
    }

    /* ---------- project pages ---------- */

    const page = document.querySelector('.project-page[data-project]');

    if (page) {
        const config = (siteMedia.projects || {})[page.dataset.project] || {};
        const slot = page.querySelector('[data-media-slot]');

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

        const el = (tag, cls, text) => {
            const node = document.createElement(tag);
            if (cls) node.className = cls;
            if (text !== undefined) node.textContent = text;
            return node;
        };

        const pad = (n) => String(n).padStart(2, '0');

        /*
         * Optional prose.
         *
         * Returns null unless the field holds real text, and every caller
         * checks before appending — so an unfilled string in media.js leaves
         * no element, no margin and no gap behind. That is the whole
         * difference between an optional field and an empty box on the page.
         *
         * A blank line in the source starts a new paragraph, which is the one
         * piece of formatting these fields need and the only one they get:
         * the text is set with textContent, so nothing written in media.js
         * can inject markup into the page.
         */
        const buildProse = (text, cls) => {
            if (!hasText(text)) return null;
            const wrap = el('div', cls);
            for (const para of String(text).split(/\n\s*\n/)) {
                if (hasText(para)) wrap.appendChild(el('p', null, para.trim()));
            }
            return wrap.children.length ? wrap : null;
        };

        /* =================================================================
         * SECTIONED LAYOUT
         *
         * Opt-in: a project that defines `sections` gets the editorial
         * composition below, one that defines hero/gallery keeps the plain
         * stacked gallery. Both paths live here so adding the first does not
         * disturb the second.
         * ================================================================= */

        const sectionHead = (section, index) => {
            if (!hasText(section.label)) return null;
            const head = el('div', 'pm-head');
            head.appendChild(el('span', 'pm-num', pad(index)));
            head.appendChild(el('h2', 'pm-label', section.label));
            return head;
        };

        /* --- 1. one frame: the finished object, motion on request --- */

        /*
         * The photograph and the loop used to stand side by side. They show
         * the same object from the same angle, so the widest row on the page
         * spent itself saying one thing twice, and because the two files are
         * different shapes the stagger that separated them read as an
         * accident rather than a composition.
         *
         * One frame instead: the still at rest, the clip layered over it and
         * faded in only when asked. The <img> is ordinary markup with nothing
         * between it and the screen \u2014 no script, no play() promise, no decode
         * to wait on \u2014 so every way this can fail (video unsupported, file
         * missing, playback refused, JavaScript off) lands on the photograph
         * instead of on an empty box.
         */
        const buildHero = (section) => {
            if (!isValidMedia(section.image)) return null;

            const wrap = el('div', 'pm-hero');
            const frame = el('div', 'pm-hero-frame');

            /*
             * The ratio belongs to the frame, not to either file. The still
             * and the clip then swap inside a box that was already the right
             * size, so nothing on the page moves when they do.
             */
            if (hasText(section.ratio)) frame.style.aspectRatio = section.ratio;

            const still = buildImage(section.image, { eager: true });
            still.classList.add('pm-hero-still');
            frame.appendChild(still);
            wrap.appendChild(frame);

            if (!isValidMedia(section.video)) return wrap;

            const clip = buildPreviewVideo(section.video);
            clip.classList.add('pm-hero-clip');

            /*
             * The page-wide "play whatever is on screen" observer must not
             * have this one. Scrolling past a frame is not a request for
             * motion; here the only things that start it are a pointer over
             * the frame, or the button.
             */
            delete clip.dataset.autoplayInView;
            frame.appendChild(clip);

            const PLAY = section.playLabel || '';
            const PAUSE = section.pauseLabel || '';

            const btn = el('button', 'pm-btn pm-hero-toggle');
            btn.type = 'button';

            let playing = false;
            /*
             * Whether this run was asked for or merely hovered into. A run the
             * visitor started on purpose must survive the pointer wandering
             * off the frame; a hover run must not.
             */
            let deliberate = false;

            const setLabel = () => {
                const label = playing ? PAUSE : PLAY;
                btn.setAttribute('aria-label', label);
                btn.replaceChildren(
                    icon(playing ? ICON.pause : ICON.play),
                    el('span', 'pm-hero-toggle-text', label)
                );
            };

            const stop = () => {
                playing = false;
                deliberate = false;
                frame.classList.remove('is-playing');
                clip.pause();
                try { clip.currentTime = 0; } catch (e) { /* not seekable yet */ }
                setLabel();
            };

            const start = (onPurpose) => {
                if (playing) {
                    // a hover during a deliberate run must not downgrade it
                    deliberate = deliberate || !!onPurpose;
                    return;
                }
                playing = true;
                deliberate = !!onPurpose;
                frame.classList.add('is-playing');
                // always from the top, so the clip is a preview rather than
                // wherever it happened to be left
                try { clip.currentTime = 0; } catch (e) { /* not seekable yet */ }
                const p = clip.play();
                // a refused play() must not leave the frame claiming to run
                if (p && p.catch) p.catch(() => stop());
                setLabel();
            };

            setLabel();

            btn.addEventListener('click', () => {
                if (playing) stop();
                else start(true);
            });

            /*
             * Hover is an extra, never the only way in. It is skipped for a
             * touch pointer (where "enter" only ever means "tap"), on devices
             * that cannot really hover, and under reduced motion \u2014 where the
             * button still works, because asking for motion is different from
             * having it happen at you.
             */
            const hoverCapable = window.matchMedia('(hover: hover)');

            frame.addEventListener('pointerenter', (e) => {
                if (e.pointerType === 'touch') return;
                if (reduceMotion.matches || !hoverCapable.matches) return;
                start(false);
            });

            frame.addEventListener('pointerleave', (e) => {
                if (e.pointerType === 'touch') return;
                if (playing && !deliberate) stop();
            });

            // nothing should be decoding behind a hidden tab
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && playing) stop();
            });

            wrap.appendChild(btn);
            return wrap;
        };

        /* --- asymmetric split: one dominant frame, one counterweight --- */
        const buildSplit = (section) => {
            const wrap = el('div', 'pm-split');
            if (isValidMedia(section.lead)) {
                const lead = el('div', 'pm-split-lead');
                // the only media above the fold, so the only one fetched eagerly
                lead.appendChild(buildFigure(section.lead, { eager: true }));
                wrap.appendChild(lead);
            }
            if (isValidMedia(section.aside)) {
                const aside = el('div', 'pm-split-aside');
                aside.appendChild(buildFigure(section.aside));
                wrap.appendChild(aside);
            }
            return wrap.children.length ? wrap : null;
        };

        /* --- 2. feature + supports, alternating sides --- */
        const buildEditorial = (section) => {
            const wrap = el('div', 'pm-editorial');
            for (const block of section.blocks || []) {
                if (!isValidMedia(block.feature)) continue;
                const row = el('div', 'pm-block' + (block.flip ? ' is-flipped' : ''));

                const feature = el('div', 'pm-feature');
                feature.appendChild(buildFigure(block.feature));
                row.appendChild(feature);

                const items = (block.support || []).filter(isValidMedia);
                if (items.length) {
                    const support = el('div', 'pm-support');
                    for (const m of items) support.appendChild(buildFigure(m));
                    row.appendChild(support);
                }
                wrap.appendChild(row);
            }
            return wrap.children.length ? wrap : null;
        };

        /* --- 4. closing frame --- */
        const buildFinale = (section) => {
            if (!isValidMedia(section.media)) return null;
            const wrap = el('div', 'pm-finale pm-rail');
            wrap.appendChild(buildFigure(section.media));
            return wrap;
        };

        /* --- a single quiet frame, used for the pre-replacement stage --- */
        const buildNote = (section) => {
            if (!isValidMedia(section.media)) return null;
            const wrap = el('div', 'pm-note pm-rail');
            wrap.appendChild(buildFigure(section.media));
            return wrap;
        };

        const icon = (d) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'currentColor');
            svg.appendChild(path);
            return svg;
        };

        const ICON = {
            play: 'M6 3.5v17l14-8.5z',
            pause: 'M6 4h4.2v16H6zM13.8 4H18v16h-4.2z'
        };

        /* =================================================================
         * 3. PROCESS VIEWER
         *
         * One stage, one slide visible. Rotation is a convenience that yields
         * to the visitor at the first sign of attention: hover, focus, a tap,
         * a hidden tab, or scrolling away all stop it, and it never resumes
         * on its own after a deliberate interaction.
         *
         * A clip advances when it ENDS rather than on a timer, so nothing is
         * ever cut off mid-shot. Stills get a fixed dwell.
         * ================================================================= */
        const buildViewer = (section) => {
            const slides = (section.slides || []).filter((s) => s && isValidMedia(s.media));
            if (!slides.length) return null;

            const IMAGE_DWELL = 5600;

            const wrap = el('div', 'pm-viewer');
            wrap.setAttribute('role', 'group');
            wrap.setAttribute('aria-roledescription', 'carousel');
            wrap.setAttribute('aria-label', section.label || 'Process viewer');

            const stage = el('div', 'pm-stage');
            stage.tabIndex = 0;
            stage.setAttribute('aria-label',
                'Process stages. Use the left and right arrow keys to move between them.');

            const nodes = slides.map((slide, i) => {
                const holder = el('div', 'pm-slide');
                holder.setAttribute('role', 'group');
                holder.setAttribute('aria-roledescription', 'slide');
                holder.setAttribute('aria-label',
                    pad(i + 1) + ' of ' + pad(slides.length) + '. ' + (slide.title || ''));

                const media = buildMediaElement(slide.media);
                /*
                 * The page-wide "play what is on screen" observer must not
                 * touch these — the viewer decides which single clip runs.
                 * Looping is off so `ended` can fire and drive the advance.
                 */
                delete media.dataset.autoplayInView;
                if (media.tagName === 'VIDEO') media.loop = false;

                holder.appendChild(media);
                stage.appendChild(holder);
                return {
                    holder, media,
                    title: slide.title || '',
                    description: slide.description || ''
                };
            });

            const bar = el('div', 'pm-bar');
            const step = el('div', 'pm-step');

            /*
             * The count is spoken, not shown. On screen the lit segment in the
             * rail below already says which stage this is, so printing "01 / 04"
             * beside the title said it twice. A screen reader has no rail to
             * look at, and "Scan result" on its own gives no sense of position
             * — so the number survives here, read out and clipped away.
             *
             * position:absolute takes it out of the flex flow entirely, so it
             * contributes no gap and leaves no space where it used to sit.
             */
            const count = el('span', 'visually-hidden');
            const title = el('span', 'pm-title');
            /*
             * Inside .pm-step rather than beside it, so the description is
             * carried by the live region that already announces the stage
             * change \u2014 one announcement per slide, not two. It is emptied
             * for a slide that has none, and :empty takes it out of the flex
             * flow entirely so an undescribed stage leaves no gap.
             */
            const desc = el('p', 'pm-desc');
            step.append(count, title, desc);
            // announced politely so a screen reader hears the stage change
            step.setAttribute('aria-live', 'polite');
            step.setAttribute('aria-atomic', 'true');

            const controls = el('div', 'pm-controls');
            const mkBtn = (name, label) => {
                const b = el('button', 'pm-btn');
                b.type = 'button';
                b.setAttribute('aria-label', label);
                b.appendChild(icon(ICON[name]));
                controls.appendChild(b);
                return b;
            };

            /*
             * One control, not three. The arrows duplicated what the numbered
             * rail does and did it worse — a rail entry names its stage and
             * goes straight there, an arrow only steps. Rotation is the one
             * thing the rail cannot express, so it is the one thing left here.
             *
             * Nothing is lost by removing them: the arrow keys and the swipe
             * below are bound to the viewer itself, never to these buttons.
             */
            const toggleBtn = mkBtn('pause', 'Pause automatic rotation');
            bar.append(step, controls);

            const rail = el('ul', 'pm-thumbs');
            rail.style.setProperty('--pm-thumbs', String(slides.length));
            const thumbs = nodes.map((n, i) => {
                const li = el('li');
                const b = el('button', 'pm-thumb');
                b.type = 'button';
                /*
                 * The number is the whole visible button. The stage name was
                 * printed here too and again in the status row above, so the
                 * active stage was named twice on screen; the aria-label is
                 * where the name belongs for anyone who needs it read out,
                 * and it still carries it in full.
                 */
                b.setAttribute('aria-label', 'Stage ' + (i + 1) + ': ' + n.title);
                b.appendChild(el('span', 'pm-thumb-num', pad(i + 1)));
                li.appendChild(b);
                rail.appendChild(li);
                return b;
            });

            wrap.append(stage, bar, rail);

            /* ---------------- state ---------------- */

            let index = 0;
            let timer = null;
            /*
             * One flag, and the control is the only thing that sets it: the
             * stage's clip runs and the stages advance, or neither happens.
             * It starts off under reduced motion, so nothing autoplays for
             * anyone who asked not to be moved.
             */
            let playing = !reduceMotion.matches;
            let onScreen = false;

            const clearTimer = () => {
                if (timer) { clearTimeout(timer); timer = null; }
            };

            /*
             * Playing and advancing are now the same question asked twice.
             *
             * A clip runs when the visitor has asked for playback and the
             * stage is really in front of them — paused means paused, and a
             * clip in a background tab or scrolled out of view is not being
             * watched either. onScreen and document.hidden never touch
             * `playing` itself, so scrolling away and back cannot overturn a
             * deliberate pause; they only decide whether the chosen state is
             * currently in effect.
             */
            const canPlay = () => playing && onScreen && !document.hidden;

            /*
             * Advancing needs all of that and one thing more. Reduced motion
             * can still watch a clip on request — that is a deliberate press,
             * not autoplay — but the stage never changes underneath them.
             */
            const canAdvance = () => canPlay() && !reduceMotion.matches;

            const show = (next) => {
                const from = index;
                index = (next + nodes.length) % nodes.length;

                nodes.forEach((n, i) => {
                    const active = i === index;
                    n.holder.classList.toggle('is-active', active);
                    n.holder.setAttribute('aria-hidden', active ? 'false' : 'true');
                    // slide in from the direction of travel; a reversed move
                    // enters from the other edge, so the motion reads as spatial
                    if (!active) {
                        n.holder.style.setProperty('--pm-shift',
                            (i < index ? '-4%' : '4%'));
                    } else {
                        n.holder.style.removeProperty('--pm-shift');
                    }
                    if (n.media.tagName !== 'VIDEO') return;
                    if (!active) {
                        // inactive clips are stopped AND rewound, so only one
                        // is ever decoding and none resume mid-shot
                        n.media.pause();
                        try { n.media.currentTime = 0; } catch (e) { /* not seekable yet */ }
                    } else if (from !== index) {
                        // and the incoming one always starts at the beginning
                        try { n.media.currentTime = 0; } catch (e) { /* not seekable yet */ }
                    }
                });

                // spoken form, not the printed one: "Stage 2 of 4" reads as a
                // sentence where "02 / 04" is read as punctuation
                count.textContent = 'Stage ' + (index + 1) + ' of ' + nodes.length + '.';
                title.textContent = nodes[index].title;
                // '' rather than a space: :empty is what hides the element
                desc.textContent = hasText(nodes[index].description)
                    ? nodes[index].description.trim()
                    : '';
                thumbs.forEach((b, i) => b.setAttribute('aria-current', i === index ? 'true' : 'false'));

                /*
                 * Choosing a stage no longer stops playback. It used to: any
                 * manual move surrendered rotation, on the reasoning that
                 * nobody should have to race a carousel back to the slide
                 * they were reading. With an explicit control that reasoning
                 * is served better by the button — and the old rule would
                 * now also silence the video, so picking stage 3 while
                 * watching would freeze it on its first frame.
                 *
                 * So a stage change inherits the current state: paused shows
                 * the new stage stopped on its poster, playing starts it.
                 */
                schedule();
            };

            const setToggle = () => {
                toggleBtn.replaceChildren(icon(playing ? ICON.pause : ICON.play));
                // the label names what the press will DO, not the current state
                toggleBtn.setAttribute('aria-label',
                    playing ? 'Pause process video' : 'Play process video');
            };

            /*
             * One timer, cleared before every reschedule, so manual navigation
             * can never leave a stale timer racing the new slide.
             */
            const schedule = () => {
                clearTimer();
                const current = nodes[index].media;

                if (current.tagName === 'VIDEO') {
                    if (canPlay()) {
                        /*
                         * play() and nothing else. currentTime is deliberately
                         * untouched here, which is what makes resuming resume:
                         * the only place it is rewound is show(), and only for
                         * a slide that is actually changing. A clip paused at
                         * 4.2s comes back at 4.2s.
                         *
                         * One exception handled by the browser rather than by
                         * us: play() on a clip that reached its end starts it
                         * over, which is the right answer for "genuinely
                         * finished" without a flag to track it.
                         */
                        const p = current.play();
                        // a refused autoplay is not an error to recover from;
                        // the poster stays and nothing advances behind it
                        if (p && p.catch) p.catch(() => { });
                    } else {
                        current.pause();
                    }
                    // a clip is never cut off part-way: the advance is driven
                    // by 'ended', never by a timer running underneath it
                    return;
                }

                if (canAdvance()) timer = setTimeout(() => show(index + 1), IMAGE_DWELL);
            };

            nodes.forEach((n) => {
                if (n.media.tagName !== 'VIDEO') return;
                n.media.addEventListener('ended', () => {
                    if (nodes[index].media !== n.media) return;
                    if (canAdvance()) { show(index + 1); return; }
                    // rotation is off, so the clip repeats in place rather
                    // than leaving a frozen last frame on the stage
                    try { n.media.currentTime = 0; } catch (e) { /* ignore */ }
                    if (canPlay()) {
                        const p = n.media.play();
                        if (p && p.catch) p.catch(() => { });
                    }
                });
            });

            thumbs.forEach((b, i) => b.addEventListener('click', () => show(i)));

            /*
             * The whole of the behaviour: flip the intent, redraw the button,
             * and let schedule() work out what that means for the clip on the
             * stage. Pausing pauses it where it stands; playing resumes it
             * there. Keyboard activation arrives here too — it is a <button>,
             * so Enter and Space fire this same click.
             */
            toggleBtn.addEventListener('click', () => {
                playing = !playing;
                setToggle();
                schedule();
            });

            wrap.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
                else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
            });

            /*
             * Hover and focus used to hold rotation. They cannot now: pressing
             * Play leaves focus on the button, which is inside the viewer, so
             * the hold would stop the clip the press just started from ever
             * advancing — and a visitor watching with the pointer resting on
             * the stage would see the same. An explicit control makes the
             * implicit one both redundant and wrong.
             */

            /* swipe: a horizontal drag past a threshold moves one stage */
            let startX = null;
            let startY = null;
            stage.addEventListener('pointerdown', (e) => {
                // a mouse drag across a picture is a selection or a stray
                // gesture, not a swipe; a mouse navigates by the rail below
                if (e.pointerType === 'mouse') return;
                startX = e.clientX; startY = e.clientY;
            });
            stage.addEventListener('pointerup', (e) => {
                if (startX === null) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                startX = startY = null;
                // must be clearly horizontal, or it was a scroll
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                    show(index + (dx < 0 ? 1 : -1));
                }
            });
            stage.addEventListener('pointercancel', () => { startX = startY = null; });

            document.addEventListener('visibilitychange', schedule);
            reduceMotion.addEventListener('change', () => {
                // switching it on mid-session stops playback outright, the
                // same as it would have prevented autoplay on load
                if (reduceMotion.matches) { playing = false; setToggle(); }
                schedule();
            });

            if ('IntersectionObserver' in window) {
                new IntersectionObserver((entries) => {
                    onScreen = entries[0].isIntersecting;
                    schedule();
                }, { threshold: 0.25 }).observe(wrap);
            } else {
                onScreen = true;
            }

            setToggle();
            show(0);
            return wrap;
        };

        /* =================================================================
         * 5. FULL FILM — click to load
         *
         * Nothing third-party is requested until the visitor asks for it: the
         * frame holds a poster, and the iframe is created on activation. That
         * keeps the page's weight and its outbound requests honest, and means
         * the film costs nothing to anyone who does not watch it.
         *
         * The Drive link below is not a fallback bolted on — it is always
         * visible, so a blocked iframe still leaves a way through.
         * ================================================================= */
        const buildFilm = (section) => {
            if (!hasText(section.src)) return null;

            const wrap = el('div', 'pm-film');

            const text = el('div', 'pm-film-text');
            if (hasText(section.title)) text.appendChild(el('h2', null, section.title));
            if (hasText(section.text)) text.appendChild(el('p', null, section.text));

            /*
             * Between the overview and the link, deliberately: the reflection
             * is the last thing read and the Drive link stays the last thing
             * done. Absent unless the field holds text.
             */
            const reflection = buildProse(section.reflection, 'pm-film-reflection');
            if (reflection) {
                if (hasText(section.reflectionLabel)) {
                    reflection.insertBefore(
                        el('p', 'pm-film-reflection-label', section.reflectionLabel),
                        reflection.firstChild);
                }
                text.appendChild(reflection);
            }

            if (hasText(section.href)) {
                const note = el('p', 'pm-film-note');
                const a = el('a', 'project-link');
                a.href = section.href;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.appendChild(document.createTextNode(section.linkLabel || 'Open film'));
                const mark = el('span', 'project-link-external', '↗');
                mark.setAttribute('aria-hidden', 'true');
                a.appendChild(mark);
                a.appendChild(el('span', 'visually-hidden', '(opens in a new tab)'));
                note.appendChild(a);
                text.appendChild(note);
            }

            const frame = el('div', 'pm-film-frame');
            if (hasText(section.ratio)) frame.style.aspectRatio = section.ratio;

            if (isValidMedia(section.poster)) {
                const poster = buildImage(section.poster);
                if (hasText(section.posterPosition)) {
                    poster.style.objectPosition = section.posterPosition;
                }
                frame.appendChild(poster);
            }

            const play = el('button', 'pm-film-play');
            play.type = 'button';
            const label = section.playLabel || 'Play film';
            play.setAttribute('aria-label', label);
            const ring = el('span', 'pm-film-play-icon');
            ring.appendChild(icon(ICON.play));
            play.append(ring, el('span', 'pm-film-play-text', label));

            play.addEventListener('click', () => {
                const iframe = document.createElement('iframe');
                iframe.src = section.src;
                iframe.title = section.iframeTitle || label;
                iframe.allow = 'fullscreen';
                iframe.allowFullscreen = true;
                iframe.loading = 'lazy';
                iframe.referrerPolicy = 'no-referrer-when-downgrade';
                frame.replaceChildren(iframe);
                iframe.focus();
            });

            frame.appendChild(play);
            wrap.append(text, frame);
            return wrap;
        };

        const LAYOUTS = {
            hero: buildHero,
            split: buildSplit,
            editorial: buildEditorial,
            carousel: buildViewer,
            film: buildFilm,
            note: buildNote,
            finale: buildFinale
        };

        if (slot && Array.isArray(config.sections) && config.sections.length) {
            let n = 0;
            for (const section of config.sections) {
                const build = LAYOUTS[section.layout];
                if (!build) continue;
                const body = build(section);
                if (!body) continue;

                const wrap = el('section', 'pm-section pm-' + section.layout + '-section');
                const head = sectionHead(section, ++n);
                if (head) wrap.appendChild(head);
                else n--;                    // unlabelled sections are not numbered

                /*
                 * Optional commentary, either side of the media. Both are
                 * null unless their field in media.js holds real text, so a
                 * section that has not been written about renders exactly as
                 * it did before these existed.
                 */
                const intro = buildProse(section.intro, 'pm-prose pm-prose-intro');
                if (intro) wrap.appendChild(intro);

                wrap.appendChild(body);

                const outro = buildProse(section.outro, 'pm-prose pm-prose-outro');
                if (outro) wrap.appendChild(outro);

                /*
                 * REVEAL HOOKS.
                 *
                 * Marked on the parts of a section, never on the section
                 * itself: a reveal on the wrapper would move its children
                 * too, and any child that also revealed would then be riding
                 * two transforms at once.
                 *
                 * The heading, the commentary and the media each arrive on
                 * their own, which is the order they are read in. Everything
                 * inside the media block travels with it — so the process
                 * viewer reveals once, as a viewer, and its slides are never
                 * touched; changing stage is the carousel's own motion and
                 * has nothing to do with the page scrolling.
                 */
                if (head) head.setAttribute('data-reveal', '');
                if (intro) intro.setAttribute('data-reveal', '');
                if (outro) outro.setAttribute('data-reveal', '');

                /*
                 * The prototype grid is the one place a section is a list of
                 * comparable things rather than one composition, so its
                 * blocks come in one after another. Everywhere else — the
                 * viewer, the film, the closing frame — the media is a single
                 * object and reveals as one.
                 */
                const blocks = body.classList && body.classList.contains('pm-editorial')
                    ? body.querySelectorAll(':scope > .pm-block')
                    : [];

                if (blocks.length) {
                    body.setAttribute('data-reveal-stagger', '90');
                    for (const block of blocks) block.setAttribute('data-reveal', '');
                } else {
                    body.setAttribute('data-reveal', '');
                }

                slot.appendChild(wrap);
            }
        } else if (slot) {
            /* ---- the original hero + gallery path, unchanged ---- */

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


/* ==========================================================================
 * SCROLL REVEAL
 *
 * Last in the file on purpose: the project pages build their sections from
 * media.js above, and an observer that ran before that would find nothing to
 * watch on exactly the pages with the most to reveal.
 *
 * TWO OBSERVERS, ONE HYSTERESIS BAND.
 *
 * The reveal and the reset deliberately do not share a boundary. If they
 * did, an element resting exactly on it would reveal and reset and reveal
 * again on every few pixels of trackpad drift — the classic flicker. So the
 * line an element must cross to appear sits well inside the viewport, and
 * the line it must cross to be put back sits well outside it, and the gap
 * between them is dead space where nothing happens at all.
 *
 * At a 900px viewport that gap is 315px below the fold and 180px above it.
 * Nothing short of a deliberate scroll can traverse it, which is what makes
 * the effect repeatable without making it twitchy.
 * ========================================================================== */

{
    const revealables = document.querySelectorAll('[data-reveal]');
    const canReveal = revealables.length
        && !reduceMotion.matches
        && typeof IntersectionObserver === 'function';

    /*
     * The hidden state is added HERE and nowhere else. Until this class
     * lands every [data-reveal] is an ordinary element, so a browser with no
     * IntersectionObserver, a blocked script, or someone who asked for
     * reduced motion all get the finished page rather than a blank one.
     */
    if (canReveal) {
        document.documentElement.classList.add('js-reveal');

        /*
         * Stagger, assigned once. A container carrying data-reveal-stagger
         * numbers its own revealable children, so the delay lives with the
         * group that wants one instead of being repeated on every child.
         *
         * The index is capped rather than the step shortened: past a few
         * items a stagger stops reading as sequence and starts reading as
         * lag, and on a phone — where the whole group may be taller than the
         * screen — a long tail means waiting for content that is already
         * where it belongs.
         */
        const narrow = window.matchMedia('(max-width: 700px)').matches;
        const cap = narrow ? 2 : 5;

        for (const group of document.querySelectorAll('[data-reveal-stagger]')) {
            const step = Number(group.dataset.revealStagger) || 80;
            const items = group.querySelectorAll('[data-reveal]');
            items.forEach((item, i) => {
                item.style.setProperty('--reveal-delay', `${Math.min(i, cap) * step}ms`);
            });
        }

        /*
         * ONE direction, read by every element, written by one listener.
         *
         * Forty elements each watching the scroll position would be forty
         * handlers computing the same number; this computes it once and the
         * observers below just read it. Passive, because it never calls
         * preventDefault and saying so keeps it off the scrolling critical
         * path.
         *
         * The 4px deadband is the other half of the anti-flicker story: a
         * trackpad resting under a hand emits a stream of one- and two-pixel
         * deltas that alternate in sign, and without this the "direction"
         * would invert several times a second while the page stood still.
         */
        let scrollDir = 'down';
        let lastY = window.scrollY;

        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (Math.abs(y - lastY) < 4) return;
            scrollDir = y > lastY ? 'down' : 'up';
            lastY = y;
        }, { passive: true });

        // a restored page resumes at a scroll position this never saw
        window.addEventListener('pageshow', () => { lastY = window.scrollY; });

        /*
         * Which edge an element is arriving over — and it is the scroll
         * direction that answers this, not the element's geometry.
         *
         * Geometry looks like the better signal and is not. entry
         * .boundingClientRect is sampled when the observation was TAKEN, and
         * the browser coalesces observations: on a fast scroll an element
         * can travel from below the fold to well above it between one
         * delivery and the next, so by the time the rect is read it says
         * "above" for something that arrived from below. Measured on this
         * page — one flick down past the featured grid reported four of
         * fourteen elements as arriving from above while the page had only
         * ever moved down.
         *
         * The direction cannot be wrong in that way, because in a scrolling
         * document it IS the answer: the viewport moving down is the only
         * thing that brings content in over the bottom edge, and moving up
         * the only thing that brings it back in over the top. An element
         * revealed while off-screen entirely gets whichever offset the
         * direction implies, and nobody sees the difference.
         */
        const arrivesFromAbove = () => scrollDir === 'up';

        const revealObserver = new IntersectionObserver((entries) => {
            const arriving = [];

            for (const entry of entries) {
                const el = entry.target;
                // already shown: a second crossing is not a second arrival
                if (!entry.isIntersecting || el.classList.contains('is-revealed')) continue;
                el.classList.toggle('is-from-above', arrivesFromAbove());
                arriving.push(el);
            }

            if (!arriving.length) return;

            /*
             * One forced layout for the whole batch, and it is load-bearing.
             *
             * Setting the direction and asking for the reveal in the same
             * task means the browser only ever computes the final style, and
             * the transition then runs from whatever the element's offset
             * was BEFORE — so something arriving from above would rise
             * through its resting place instead of falling into it. Reading
             * a layout property in between forces the starting offset to be
             * computed, which is what gives the transition its true origin.
             *
             * Free of charge visually: every element in this list is at
             * opacity 0, so moving one from +24px to -20px is not something
             * anyone can see. Read once for the batch rather than per
             * element, so a screenful of arrivals costs one layout, not ten.
             */
            void document.documentElement.offsetHeight;

            for (const el of arriving) el.classList.add('is-revealed');
        }, {
            /*
             * threshold 0 with the bottom of the root pulled up: the reveal
             * starts when an element is genuinely on its way in rather than
             * when some fraction of it is showing — which for a section
             * taller than the viewport would never be reached at all.
             *
             * Anything already past this line when the page loads fires on
             * the observer's first callback, so a deep-linked anchor or a
             * restored scroll position never leaves content invisible, and a
             * fast scroll cannot outrun it.
             */
            rootMargin: '0px 0px -10% 0px',
            threshold: 0
        });

        /*
         * The far boundary. This observer only ever hears about an element
         * that has left the viewport AND kept going for another fifth of a
         * screen — so "no meaningful portion of it remains visible" is not a
         * judgement call made in here, it is the shape of the root box.
         */
        const resetObserver = new IntersectionObserver((entries) => {
            const leaving = [];

            for (const entry of entries) {
                const el = entry.target;
                if (entry.isIntersecting || !el.classList.contains('is-revealed')) continue;
                leaving.push(el);
            }

            if (!leaving.length) return;

            for (const el of leaving) {
                el.classList.add('is-resetting');
                // is-settled goes too, so will-change is back on before the
                // next arrival rather than being granted halfway through it
                el.classList.remove('is-revealed', 'is-settled');
            }

            // land the hidden state with no transition, then hand the
            // transition back for the next arrival
            void document.documentElement.offsetHeight;

            for (const el of leaving) el.classList.remove('is-resetting');
        }, {
            rootMargin: '20% 0px 20% 0px',
            threshold: 0
        });

        for (const el of revealables) {
            revealObserver.observe(el);
            resetObserver.observe(el);
        }

        /*
         * will-change is a promise to the compositor, and one that has been
         * kept should be withdrawn. Capture phase because transitionend does
         * bubble but the target is what matters, and one listener on the
         * document is cheaper than one on each of forty elements.
         */
        document.addEventListener('transitionend', (event) => {
            const el = event.target;
            if (event.propertyName !== 'opacity') return;
            if (!el.hasAttribute || !el.hasAttribute('data-reveal')) return;
            if (el.classList.contains('is-revealed')) el.classList.add('is-settled');
        }, true);

        /*
         * Turning the setting on mid-session stops the whole mechanism: the
         * observers are dropped so nothing can be hidden again, and anything
         * currently hidden is shown. The media query in style.css covers the
         * paint; this covers the state, so a later scroll cannot undo it.
         */
        reduceMotion.addEventListener('change', () => {
            if (!reduceMotion.matches) return;
            revealObserver.disconnect();
            resetObserver.disconnect();
            for (const el of revealables) {
                el.classList.remove('is-from-above', 'is-resetting');
                el.classList.add('is-revealed', 'is-settled');
            }
        });
    }
}
