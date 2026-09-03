/*
 * PROJECT AND CASE-STUDY BEHAVIOUR. Loaded by the project pages before
 * js/site.js, for the same reason home.js is.
 *
 * Hero and gallery rendering, the sectioned process-media layout, the
 * process viewer with its playback, stage navigation and swipe, the full
 * film, and the in-view playback of preview clips.
 */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
             * Which part of itself a frame keeps when a ratio crops it. Only
             * meaningful alongside object-fit: cover, and only written when the
             * entry names one, so nothing gains an inline style by default.
             */
            if (hasText(m.focus)) el.style.objectPosition = m.focus;

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
             * Optional prose. Returns null unless the field holds real text, and
             * every caller checks before appending — so an unfilled string in
             * media.js leaves no element, no margin and no gap behind.
             */
            const buildProse = (text, cls) => {
                if (!hasText(text)) return null;
                const wrap = el('div', cls);
                for (const para of String(text).split(/\n\s*\n/)) {
                    if (hasText(para)) wrap.appendChild(el('p', null, para.trim()));
                }
                return wrap.children.length ? wrap : null;
            };

            /* Sectioned layout */

            const sectionHead = (section, index) => {
                if (!hasText(section.label)) return null;
                const head = el('div', 'pm-head');
                head.appendChild(el('span', 'pm-num', pad(index)));
                head.appendChild(el('h2', 'pm-label', section.label));
                return head;
            };

            /* --- 1. one frame: the finished object, motion on request --- */

            /*
             * One frame, not two: the still and the loop show the same object
             * from the same angle.
             */
            const buildHero = (section) => {
                if (!isValidMedia(section.image)) return null;

                const wrap = el('div', 'pm-hero');
                const frame = el('div', 'pm-hero-frame');

                /*
                 * The ratio belongs to the frame, not to either file. The still and
                 * the clip then swap inside a box that was already the right size,
                 * so nothing on the page moves when they do.
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
                 * The page-wide "play whatever is on screen" observer must not have
                 * this one.
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
                 * visitor started on purpose must survive the pointer wandering off
                 * the frame; a hover run must not.
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
                 * that cannot really hover, and under reduced motion \u2014 where
                 * the button still works, because asking for motion is different
                 * from having it happen at you.
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

            /*
             * Named compositions, so a block says what it is rather than the
             * stylesheet counting children. A name not listed here is ignored,
             * which keeps a typo in media.js from inventing a class.
             */
            const BLOCK_VARIANTS = {
                /* the supports stack in one column, the feature is tall beside them */
                'stacked-pair': 'is-stacked-pair'
            };

            const buildEditorial = (section) => {
                const wrap = el('div', 'pm-editorial');
                for (const block of section.blocks || []) {
                    if (!isValidMedia(block.feature)) continue;
                    const variant = BLOCK_VARIANTS[block.variant] || '';
                    const row = el('div', 'pm-block' + (block.flip ? ' is-flipped' : '')
                        + (variant ? ' ' + variant : ''));

                    const feature = el('div', 'pm-feature');
                    feature.appendChild(buildFigure(block.feature));

                    const items = (block.support || []).filter(isValidMedia);
                    let support = null;
                    if (items.length) {
                        support = el('div', 'pm-support');
                        for (const m of items) support.appendChild(buildFigure(m));
                    }

                    /*
                     * Source order is the order these are read in, and on a phone
                     * it is the order they stack in. The stacked pair leads because
                     * it came first; every other block leads with its feature.
                     */
                    if (block.variant === 'stacked-pair' && support) {
                        row.appendChild(support);
                        row.appendChild(feature);
                    } else {
                        row.appendChild(feature);
                        if (support) row.appendChild(support);
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

            /* 3. process viewer */

            /*
             * Named viewer compositions, opted into by the section itself. A
             * name that is not listed here is ignored, so a typo in media.js
             * cannot invent a class, and no carousel changes shape because of
             * where it happens to sit on the page.
             */
            const VIEWER_VARIANTS = {
                /* copy inside the frame, numbered rail still below it */
                'overlay-copy': 'is-overlay-copy'
            };

            const buildViewer = (section) => {
                const slides = (section.slides || []).filter((s) => s && isValidMedia(s.media));
                if (!slides.length) return null;

                const IMAGE_DWELL = 5600;

                const variant = VIEWER_VARIANTS[section.variant] || '';
                const overlayCopy = variant === 'is-overlay-copy';

                const wrap = el('div', 'pm-viewer' + (variant ? ' ' + variant : ''));
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
                     * The page-wide "play what is on screen" observer must not touch
                     * these — the viewer decides which single clip runs.
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
                 * Two counts, one of them spoken. "Stage 2 of 4." reads as a
                 * sentence where "02 / 04" is read as punctuation, so the live
                 * region keeps the sentence and the printed pair is hidden from
                 * it. The pair is printed only inside the frame, where the rail
                 * is no longer beside the title saying the same thing twice.
                 */
                const count = el('span', 'visually-hidden');
                const shown = el('span', 'pm-count');
                shown.setAttribute('aria-hidden', 'true');
                const title = el('span', 'pm-title');
                /*
                 * Inside .pm-step rather than beside it, so the description is
                 * carried by the live region that already announces the stage change
                 * \u2014 one announcement per slide, not two.
                 */
                const desc = el('p', 'pm-desc');
                if (overlayCopy) step.append(shown, count, title, desc);
                else step.append(count, title, desc);
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
                 * rail does and did it worse — a rail entry names its stage and goes
                 * straight there, an arrow only steps.
                 */
                const toggleBtn = mkBtn('pause', 'Pause automatic rotation');
                if (!overlayCopy) bar.append(step, controls);

                const rail = el('ul', 'pm-thumbs');
                rail.style.setProperty('--pm-thumbs', String(slides.length));
                const thumbs = nodes.map((n, i) => {
                    const li = el('li');
                    const b = el('button', 'pm-thumb');
                    b.type = 'button';
                    /*
                     * The number is the whole visible button; the stage name is
                     * carried by the aria-label for anyone who needs it read out.
                     */
                    b.setAttribute('aria-label', 'Stage ' + (i + 1) + ': ' + n.title);
                    b.appendChild(el('span', 'pm-thumb-num', pad(i + 1)));
                    li.appendChild(b);
                    rail.appendChild(li);
                    return b;
                });

                if (overlayCopy) {
                    /*
                     * The copy moves inside the frame and the control to its top
                     * corner, so neither sits on the other. The overlay takes no
                     * pointer events, so a swipe still reaches the stage under
                     * it, and the bar is not built at all -- there is no second
                     * copy of the title and description below the picture.
                     */
                    const overlay = el('div', 'pm-overlay');
                    overlay.appendChild(step);
                    stage.append(overlay, controls);
                    wrap.append(stage, rail);
                } else {
                    wrap.append(stage, bar, rail);
                }

                /* ---------------- state ---------------- */

                let index = 0;
                let timer = null;
                /*
                 * One flag, and the control is the only thing that sets it: the
                 * stage's clip runs and the stages advance, or neither happens.
                 */
                let playing = !reduceMotion.matches;
                let onScreen = false;

                const clearTimer = () => {
                    if (timer) { clearTimeout(timer); timer = null; }
                };

                /*
                 * Playing and advancing are now the same question asked twice. A
                 * clip runs when the visitor has asked for playback and the stage is
                 * really in front of them — paused means paused, and a clip in a
                 * background tab or scrolled out of view is not being watched
                 * either. onScreen and document.hidden never touch `playing` itself,
                 * so scrolling away and back cannot overturn a deliberate pause;
                 * they only decide whether the chosen state is currently in effect.
                 */
                const canPlay = () => playing && onScreen && !document.hidden;

                /*
                 * Advancing needs all of that and one thing more. Reduced motion can
                 * still watch a clip on request — that is a deliberate press, not
                 * autoplay — but the stage never changes underneath them.
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
                    shown.textContent = pad(index + 1) + ' / ' + pad(nodes.length);
                    title.textContent = nodes[index].title;
                    // '' rather than a space: :empty is what hides the element
                    desc.textContent = hasText(nodes[index].description)
                        ? nodes[index].description.trim()
                        : '';
                    thumbs.forEach((b, i) => b.setAttribute('aria-current', i === index ? 'true' : 'false'));

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
                             * the only place it is rewound is show(), and only for a
                             * slide that is actually changing.
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
                 * stage.
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
                 * Rotation must not be held by hover or focus: Play leaves focus
                 * on a button inside the viewer, so the hold would stop the clip
                 * the press had just started.
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

            /* 5. full film — click to load */
            const buildFilm = (section) => {
                if (!hasText(section.src)) return null;

                const wrap = el('div', 'pm-film');

                const text = el('div', 'pm-film-text');
                if (hasText(section.title)) text.appendChild(el('h2', null, section.title));
                if (hasText(section.text)) text.appendChild(el('p', null, section.text));

                /*
                 * Between the overview and the link, deliberately: the reflection is
                 * the last thing read and the Drive link stays the last thing done.
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
                     * Optional commentary, either side of the media. Both are null
                     * unless their field in media.js holds real text, so a section
                     * that has not been written about renders exactly as it did
                     * before these existed.
                     */
                    const intro = buildProse(section.intro, 'pm-prose pm-prose-intro');
                    if (intro) wrap.appendChild(intro);

                    wrap.appendChild(body);

                    const outro = buildProse(section.outro, 'pm-prose pm-prose-outro');
                    if (outro) wrap.appendChild(outro);

                    /*
                     * REVEAL HOOKS. Marked on the parts of a section, never on the
                     * section itself: a reveal on the wrapper would move its
                     * children too, and any child that also revealed would then be
                     * riding two transforms at once.
                     */
                    if (head) head.setAttribute('data-reveal', '');
                    if (intro) intro.setAttribute('data-reveal', '');
                    if (outro) outro.setAttribute('data-reveal', '');

                    /*
                     * The prototype grid is the one place a section is a list of
                     * comparable things rather than one composition, so its blocks
                     * come in one after another.
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

}());
