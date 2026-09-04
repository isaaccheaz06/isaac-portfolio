/*
 * SHARED BEHAVIOUR. Loaded by every page, always last, so the page's own
 * rendering has finished before the reveal observer scans the DOM.
 *
 * Navbar sizing, hiding and anchor navigation; the hover-label cursor that
 * serves VIEW, IN PROGRESS and the navbar logo's Home; the scroll-reveal
 * engine, and the page-lifecycle handling those need.
 */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* Navbar and anchor navigation */

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
         * instead.
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
         * Anchor navigation vs. auto-hide. Jumping to #work/#about/#contact always
         * scrolls DOWN, which tripped the auto-hide below.
         */
        let anchorNavigating = false;
        let anchorNavStartedAt = 0;
        let settleTimer = null;

        /*
         * With scroll-behavior:auto — which is what prefers-reduced-motion users get
         * — the jump is instantaneous and scrollend can fire in the same frame,
         * releasing the guard before the trailing scroll events have settled and
         * letting the auto-hide fire anyway.
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


    /* Featured-card cursor */

    /* One block, shared by everything that wants to say something under the pointer. */
    const cursorTargets = document.querySelectorAll('[data-cursor-label]');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    /*
     * A block that follows the pointer is only meaningful where there IS a pointer
     * to follow, and hiding the real cursor for someone who asked for less motion
     * takes away a thing they rely on to give them a thing they did not ask for.
     */
    if (cursorTargets.length && finePointer.matches && !reduceMotion.matches
        && !document.querySelector('.card-cursor')) {

        const cursor = document.createElement('div');
        cursor.className = 'card-cursor';
        // decorative: the card's own title and descriptor already say where this
        // link goes, and a screen reader has no pointer for this to follow
        cursor.setAttribute('aria-hidden', 'true');

        const box = document.createElement('span');
        box.className = 'card-cursor-box';
        cursor.appendChild(box);
        document.body.appendChild(cursor);

        /*
         * Beside the pointer, not under it. The system cursor is left alone — it is
         * the thing that says "this is clickable" and it says it in the shape the
         * visitor's own OS taught them — so this sits down and to the right of the
         * arrow's tip, clear of the roughly 12x19px the arrow itself occupies.
         */
        const OFFSET_X = 16;
        const OFFSET_Y = 8;
        const EDGE = 8;

        let x = 0;
        let y = 0;
        let frame = null;
        let shown = false;

                /*
         * The label is read when the pointer arrives, so a target that rewrites it
         * -- the process viewer says Pause while its clip runs -- would otherwise
         * keep showing whatever it said on arrival. One observer on the element
         * under the pointer, disconnected the moment it is not, with no polling.
         */
        let hovered = null;

        const watcher = ('MutationObserver' in window) ? new MutationObserver(() => {
            if (!shown || !hovered) return;
            const label = hovered.dataset.cursorLabel;
            if (box.textContent !== label) box.textContent = label;
        }) : null;

        const draw = () => {
            frame = null;

            /*
             * Flipped rather than squashed at an edge. Placing it to the left of the
             * pointer keeps the whole label on screen and keeps the same gap between
             * arrow and box, where clamping would slide the box under the arrow at
             * exactly the moment it is hardest to read.
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

        const show = (event, target) => {
            x = event.clientX;
            y = event.clientY;

            /*
             * Written only when it actually changes. The box is sized by its own
             * text, so every write is a relayout — and the pointer crosses a card
             * hundreds of times on the way across it.
             */
            const label = target.dataset.cursorLabel;
            if (box.textContent !== label) box.textContent = label;

            if (target !== hovered) {
                if (watcher) {
                    watcher.disconnect();
                    watcher.observe(target, {
                        attributes: true, attributeFilter: ['data-cursor-label']
                    });
                }
                hovered = target;
            }

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
            if (watcher) watcher.disconnect();
            hovered = null;
            if (!shown) return;
            shown = false;
            cursor.classList.remove('is-visible');
            if (frame !== null) {
                cancelAnimationFrame(frame);
                frame = null;
            }
        };

        const labelled = (node) =>
            (node && node.closest) ? node.closest('[data-cursor-label]') : null;

        document.addEventListener('pointermove', (event) => {
            if (event.pointerType !== 'mouse') return;
            const target = labelled(event.target);
            if (target) show(event, target);
            else hide();
        }, { passive: true });

        // entering without moving again — the page scrolling under a still
        // pointer, or the pointer arriving from outside the window
        document.addEventListener('pointerover', (event) => {
            if (event.pointerType !== 'mouse') return;
            const target = labelled(event.target);
            if (target) show(event, target);
        });

        /*
         * Every way out that is not a pointer moving off a target. A block left
         * visible after any of these is a block frozen on screen with no cursor near
         * it, which is worse than never showing one.
         */
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


    /* Scroll reveal */

    {
        const revealables = document.querySelectorAll('[data-reveal]');
        const canReveal = revealables.length
            && !reduceMotion.matches
            && typeof IntersectionObserver === 'function';

        /*
         * The hidden state is added HERE and nowhere else. Until this class lands
         * every [data-reveal] is an ordinary element, so a browser with no
         * IntersectionObserver, a blocked script, or someone who asked for reduced
         * motion all get the finished page rather than a blank one.
         */
        if (canReveal) {
            document.documentElement.classList.add('js-reveal');

            /*
             * Stagger, assigned once. A container carrying data-reveal-stagger
             * numbers its own revealable children, so the delay lives with the group
             * that wants one instead of being repeated on every child.
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

            /* ONE direction, read by every element, written by one listener. */
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

                /* One forced layout for the whole batch, and it is load-bearing. */
                void document.documentElement.offsetHeight;

                for (const el of arriving) el.classList.add('is-revealed');
            }, {
                /*
                 * threshold 0 with the bottom of the root pulled up: the reveal
                 * starts when an element is genuinely on its way in rather than when
                 * some fraction of it is showing — which for a section taller than
                 * the viewport would never be reached at all.
                 */
                rootMargin: '0px 0px -10% 0px',
                threshold: 0
            });

            /*
             * The far boundary. This observer only ever hears about an element that
             * has left the viewport AND kept going for another fifth of a screen —
             * so "no meaningful portion of it remains visible" is not a judgement
             * call made in here, it is the shape of the root box.
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
             * will-change is a promise to the compositor, and one that has been kept
             * should be withdrawn. Capture phase because transitionend does bubble
             * but the target is what matters, and one listener on the document is
             * cheaper than one on each of forty elements.
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
             * currently hidden is shown.
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


}());
