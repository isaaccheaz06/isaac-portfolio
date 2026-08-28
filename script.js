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
