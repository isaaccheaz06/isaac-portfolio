const navbar = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

// guarded: this file is shared with pages that may not render a navbar,
// and an unguarded classList call here throws on every scroll frame
if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 80) {
            navbar.classList.add('navbar-hidden');
        } else if (currentScrollY < lastScrollY) {
            navbar.classList.remove('navbar-hidden');
        }

        lastScrollY = currentScrollY;
    });
}

const collage = document.getElementById('collage');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(pointer: coarse)');

if (collage && !reduceMotion.matches && !coarsePointer.matches) {
    const tiles = [...collage.querySelectorAll('.tile')].map((tile) => ({
        el: tile,
        depth: Number(tile.dataset.depth) || 1,
        rotation: getComputedStyle(tile).transform,
    }));

    let frame = null;

    collage.addEventListener('mousemove', (event) => {
        if (frame) return;

        frame = requestAnimationFrame(() => {
            frame = null;
            const bounds = collage.getBoundingClientRect();
            const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
            const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

            for (const { el, depth, rotation } of tiles) {
                const x = -offsetX * depth * 16;
                const y = -offsetY * depth * 16;
                el.style.transform = `translate(${x}px, ${y}px) ${rotation}`;
            }
        });
    });

    collage.addEventListener('mouseleave', () => {
        for (const { el } of tiles) {
            el.style.transform = '';
        }
    });
}

/* ---------- cursor ripple (site-wide) ---------- */

if (!reduceMotion.matches && !coarsePointer.matches) {
    // spacing, not a timer — ties ripple density to how fast the cursor is
    // actually moving instead of firing on a fixed interval
    const RIPPLE_SPACING = 10;
    // hard ceiling on rings in flight — RIPPLE_SPACING is dense enough that
    // a fast swipe across a large screen could otherwise spawn dozens of
    // elements at once
    const MAX_CONCURRENT = 40;

    let lastX = null;
    let lastY = null;
    let liveCount = 0;

    // one ring, from base scale to a randomised peak, with its own delay,
    // size and colour so the pair reads as a wavefront and its echo rather
    // than two identical circles
    const spawnRing = (x, y, { delay, size, peakScale, peakOpacity, colorVar }) => {
        const ring = document.createElement('span');
        ring.className = 'cursor-ripple';
        ring.style.left = `${x}px`;
        ring.style.top = `${y}px`;
        ring.style.width = `${size}px`;
        ring.style.height = `${size}px`;
        ring.style.borderColor = `var(${colorVar})`;
        document.body.appendChild(ring);
        liveCount++;

        // real ripples aren't perfectly round — a small, fixed-per-ring
        // stretch keeps two rings from a single spawn from ever looking
        // identical
        const stretch = 1 + ((x + y) % 7) / 60;

        const animation = ring.animate(
            [
                { transform: `translate(-50%, -50%) scale(0.4, ${0.4 * stretch})`, opacity: peakOpacity },
                { transform: `translate(-50%, -50%) scale(${peakScale}, ${peakScale * stretch})`, opacity: 0 },
            ],
            { duration: 700 + Math.random() * 250, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1.25)' }
        );

        animation.onfinish = () => {
            ring.remove();
            liveCount--;
        };
    };

    const spawnRipple = (x, y) => {
        if (liveCount >= MAX_CONCURRENT) return;

        const size = 18 + Math.random() * 10;
        const peakScale = 2.1 + Math.random() * 0.6;

        // leading wavefront
        spawnRing(x, y, { delay: 0, size, peakScale, peakOpacity: 0.5, colorVar: '--border-strong' });
        // fainter, smaller echo just behind it
        spawnRing(x, y, { delay: 90, size: size * 0.7, peakScale: peakScale * 0.75, peakOpacity: 0.3, colorVar: '--border' });
    };

    document.addEventListener('mousemove', (event) => {
        const { clientX: x, clientY: y } = event;

        if (lastX !== null && Math.hypot(x - lastX, y - lastY) < RIPPLE_SPACING) {
            return;
        }

        lastX = x;
        lastY = y;
        spawnRipple(x, y);
    });

    document.addEventListener('mouseleave', () => {
        lastX = null;
        lastY = null;
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
