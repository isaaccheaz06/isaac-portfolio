/*
 * THE POINT-CLOUD VASE  —  Digital Kintsugi only.
 *
 * Loaded by projects/digital-kintsugi.html and by nothing else. Three.js, the
 * loader and the sampler are pinned to one version by the import map on that
 * page, and none of it is fetched until the stage is near the viewport: this
 * file is a few kilobytes of scheduling, and the library and the 4.3MB model
 * arrive together, once, when they are about to be needed.
 *
 * The model holds six meshes with no names and no transforms of their own. The
 * largest by triangle count is the vase; the other five are the repair. They
 * are already in their assembled coordinates, so both are measured and scaled
 * as ONE object — centring them separately would pull the repair off the break.
 *
 * The vase arrives already assembled. There is no entrance animation: the
 * points are written once, at their final positions, so the position buffers
 * are uploaded a single time and a frame costs one matrix update.
 */

const stage = document.querySelector('[data-kintsugi-stage]');
if (stage) setup(stage);


function setup(stage) {
    const fallback = stage.querySelector('.kintsugi-fallback');
    const loading = stage.querySelector('.kintsugi-loading');
    const src = stage.dataset.kintsugiStage;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /*
     * The photograph is what this falls back to, so failing is never a blank
     * column: no WebGL, a blocked CDN, a missing model, a lost context.
     */
    let settled = false;
    const giveUp = () => {
        if (settled) return;
        settled = true;
        if (loading) loading.remove();
        if (fallback) fallback.hidden = false;
        stage.classList.add('is-fallback');
        stage.removeAttribute('data-cursor-label');
    };

    if (!hasWebGL()) {
        giveUp();
        return;
    }

    /*
     * 400px of margin, so the fetch starts while the section above is still
     * being read and the model is built by the time it is looked at.
     */
    let started = false;
    const near = new IntersectionObserver((entries) => {
        if (!started && entries.some((e) => e.isIntersecting)) {
            started = true;
            near.disconnect();
            start().catch(giveUp);
        }
    }, { rootMargin: '400px 0px' });
    near.observe(stage);

    async function start() {
        const [THREE, { GLTFLoader }, { MeshSurfaceSampler }] = await Promise.all([
            import('three'),
            import('three/addons/loaders/GLTFLoader.js'),
            import('three/addons/math/MeshSurfaceSampler.js')
        ]);

        const gltf = await new GLTFLoader().loadAsync(new URL(src, document.baseURI).href);
        if (settled) return;                       // gave up while it was in flight
        build(THREE, MeshSurfaceSampler, gltf);
    }

    function build(THREE, MeshSurfaceSampler, gltf) {
        const VASE_POINTS = 22000;
        const REPAIR_POINTS = 3000;
        const TARGET_SIZE = 2;                     // longest axis, in scene units

        /*
         * Both clouds are opaque. A PointsMaterial with transparent:true over a
         * transparent canvas composites against premultiplied alpha and the pale
         * points vanish entirely — measured on this page: 0 pale pixels drawn
         * with it on, 42,848 with it off. alphaTest is what makes a point round,
         * so nothing is lost by dropping the blending, and depth sorts properly
         * without it. The repair reads as the brighter of the two through colour
         * and size, never through opacity.
         */
        const VASE_COLOUR = 0xcfc9be;              // warm off-white
        const REPAIR_COLOUR = 0xd0a53f;            // muted gold
        const VASE_SIZE = 0.02;
        const REPAIR_SIZE = 0.028;

        gltf.scene.updateMatrixWorld(true);

        const meshes = [];
        gltf.scene.traverse((o) => {
            if (o.isMesh && o.geometry && o.geometry.getAttribute('position')) meshes.push(o);
        });
        if (!meshes.length) throw new Error('no meshes in the model');

        /*
         * World matrices are baked in before anything is measured or sampled, so
         * the two sets stay in the coordinates the file assembled them in. Named
         * lookups are deliberately avoided: the nodes have no names.
         */
        const baked = meshes.map((m) => {
            const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone());
            g.applyMatrix4(m.matrixWorld);
            return { geometry: g, triangles: g.getAttribute('position').count / 3 };
        });

        let vase = baked[0];
        for (const b of baked) if (b.triangles > vase.triangles) vase = b;
        const repair = baked.filter((b) => b !== vase);

        /* one measurement for the pair of them */
        const box = new THREE.Box3();
        const tmp = new THREE.Box3();
        for (const b of baked) {
            b.geometry.computeBoundingBox();
            box.union(tmp.copy(b.geometry.boundingBox));
        }
        const centre = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = TARGET_SIZE / Math.max(size.x, size.y, size.z);

        /*
         * The file is stored upside down. Turning it over is a half turn about
         * X, baked into the points rather than set on the group, so the group's
         * own Y stays the axis the vase spins about and a drag is not inverted.
         */
        const normalise = (v) => {
            v.sub(centre).multiplyScalar(scale);
            v.y = -v.y;
            v.z = -v.z;
            return v;
        };

        /*
         * Area-weighted, not one point per vertex: the vase carries 50,000
         * triangles that are dense at the rim and sparse down the wall, and
         * drawing its vertices would inherit that unevenness. The repair budget
         * is split between its five meshes by surface area for the same reason —
         * an 8-triangle panel can be larger than an 812-triangle shell.
         */
        const sampleInto = (entry, count, target) => {
            const mesh = new THREE.Mesh(entry.geometry, new THREE.MeshBasicMaterial());
            const sampler = new MeshSurfaceSampler(mesh).build();
            const p = new THREE.Vector3();
            for (let i = 0; i < count; i++) {
                sampler.sample(p);
                normalise(p);
                target.push(p.x, p.y, p.z);
            }
            mesh.material.dispose();
        };

        const vaseArr = [];
        sampleInto(vase, VASE_POINTS, vaseArr);

        const areas = repair.map(surfaceArea);
        const areaTotal = areas.reduce((a, b) => a + b, 0) || 1;
        const repairArr = [];
        repair.forEach((entry, i) => {
            const n = Math.max(1, Math.round(REPAIR_POINTS * areas[i] / areaTotal));
            sampleInto(entry, n, repairArr);
        });

        /* the source meshes are not needed once they have been sampled */
        for (const b of baked) b.geometry.dispose();
        disposeScene(gltf.scene);

        const vasePos = new Float32Array(vaseArr);
        const repairPos = new Float32Array(repairArr);

        /* ------------------------------------------------ scene and render */
        const canvas = document.createElement('canvas');

        /*
         * Described, not focusable. There is no keyboard equivalent of a drag
         * here, and a tab stop that does nothing is worse than no tab stop, so
         * this announces what it is and stays out of the tab order.
         */
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', stage.dataset.kintsugiLabel
            || 'Point-cloud model of the repaired ceramic vase.');
        stage.insertBefore(canvas, stage.firstChild);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true, antialias: true, canvas, powerPreference: 'low-power'
            });
        } catch (err) {
            canvas.remove();
            giveUp();
            return;
        }
        renderer.setClearAlpha(0);                 // the page's own black shows through
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        const group = new THREE.Group();
        scene.add(group);

        const dot = circleTexture(THREE);
        const vaseCloud = cloud(vasePos, VASE_COLOUR, VASE_SIZE);
        const repairCloud = cloud(repairPos, REPAIR_COLOUR, REPAIR_SIZE);
        group.add(vaseCloud.points, repairCloud.points);

        function cloud(positions, color, size) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const material = new THREE.PointsMaterial({
                alphaTest: 0.5,                    // a hard round edge, and depth still sorts
                color,
                map: dot,
                size,
                sizeAttenuation: true
            });
            return { points: new THREE.Points(geometry, material), geometry, material };
        }

        /* --------------------------------------------------------- framing */

        /*
         * Framed on the extent the vase can actually reach while it turns — its
         * height, and its widest radius about the Y axis — rather than on a
         * bounding sphere. The sphere would be the diagonal and would sit the
         * model too far back in a tall, narrow column.
         */
        let halfH = 0;
        let radius = 0;
        for (const arr of [vasePos, repairPos]) {
            for (let i = 0; i < arr.length; i += 3) {
                halfH = Math.max(halfH, Math.abs(arr[i + 1]));
                radius = Math.max(radius, Math.hypot(arr[i], arr[i + 2]));
            }
        }

        /*
         * The distance has to clear the NEAR face, not the centre. A point at
         * the widest radius on the side facing the lens is `radius` closer than
         * the middle, so it projects that much larger: framing on the centre
         * plane alone puts it at 1.12 in clip space and the vase loses its edge
         * every time it turns. Adding the radius back is what makes the fit hold
         * through a full revolution, at any shape of container.
         */
        const MARGIN = 1.06;
        const frame = () => {
            const w = stage.clientWidth || 1;
            const h = stage.clientHeight || 1;
            camera.aspect = w / h;
            const half = Math.tan((camera.fov * Math.PI) / 360);
            const reach = Math.max(halfH / half, radius / (half * camera.aspect));
            camera.position.z = (reach + radius) * MARGIN;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
            needsRender = true;
        };

        /* ------------------------------------------------------ the drag */
        const still = reduceMotion.matches;
        const MAX_TILT = 0.22;                     // radians: a look over the rim, no flip
        const AUTO_SPEED = 0.07;                   // rad/s — one turn in about 90 seconds

        let rotY = 0.6;
        let rotX = 0.05;
        let dragging = false;
        let lastX = 0;
        let lastY = 0;
        let autoBlend = 1;                         // eases back in after a release
        let pointerId = null;

        const onDown = (e) => {
            /*
             * A mouse drags; a finger scrolls. Touch and pen are ignored, so a
             * touch beginning on the model still scrolls the page -- on a phone
             * this box is a third of the screen, and catching those touches to
             * spin a vase made the page feel stuck. Nothing is lost by it: the
             * slow automatic turn already shows every side of the model.
             */
            if (e.pointerType !== 'mouse') return;

            dragging = true;
            autoBlend = 0;
            lastX = e.clientX;
            lastY = e.clientY;
            pointerId = e.pointerId;
            stage.setPointerCapture(pointerId);
        };
        const onMove = (e) => {
            if (!dragging) return;
            rotY += (e.clientX - lastX) * 0.007;
            rotX = clamp(rotX + (e.clientY - lastY) * 0.005, -MAX_TILT, MAX_TILT);
            lastX = e.clientX;
            lastY = e.clientY;
            needsRender = true;
        };
        const onUp = () => {
            if (!dragging) return;
            dragging = false;
            if (pointerId !== null && stage.hasPointerCapture(pointerId)) {
                stage.releasePointerCapture(pointerId);
            }
            pointerId = null;
        };

        stage.addEventListener('pointerdown', onDown);
        stage.addEventListener('pointermove', onMove);
        stage.addEventListener('pointerup', onUp);
        stage.addEventListener('pointercancel', onUp);
        // a drag is not a text selection
        stage.addEventListener('dragstart', (e) => e.preventDefault());

        /* ------------------------------------------------------- the loop */
        let raf = null;
        let running = false;
        let needsRender = true;
        let last = 0;

        const tick = (now) => {
            raf = requestAnimationFrame(tick);
            const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
            last = now;

            if (!still && !dragging) {
                autoBlend = Math.min(1, autoBlend + dt / 1.4);   // gently, after a release
                rotY += AUTO_SPEED * dt * easeInOutSine(autoBlend);
                needsRender = true;
            }

            if (needsRender) {
                group.rotation.y = rotY;
                group.rotation.x = rotX;
                renderer.render(scene, camera);
                needsRender = false;
            }
        };

        const play = () => {
            if (running) return;
            running = true;
            last = 0;
            raf = requestAnimationFrame(tick);
        };
        const pause = () => {
            running = false;
            if (raf !== null) cancelAnimationFrame(raf);
            raf = null;
        };

        /* offscreen or a hidden tab renders nothing at all */
        let onScreen = false;
        const visible = new IntersectionObserver((entries) => {
            onScreen = entries.some((e) => e.isIntersecting);
            if (onScreen && !document.hidden) play();
            else pause();
        }, { threshold: 0 });
        visible.observe(stage);

        const onVisibility = () => {
            if (document.hidden) pause();
            else if (onScreen) play();
        };
        document.addEventListener('visibilitychange', onVisibility);

        const ro = new ResizeObserver(frame);
        ro.observe(stage);
        frame();

        if (loading) loading.remove();
        stage.classList.add('is-ready');
        settled = true;

        /* ----------------------------------------------------- and tidy up */
        const destroy = () => {
            pause();
            visible.disconnect();
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            stage.removeEventListener('pointerdown', onDown);
            stage.removeEventListener('pointermove', onMove);
            stage.removeEventListener('pointerup', onUp);
            stage.removeEventListener('pointercancel', onUp);
            vaseCloud.geometry.dispose();
            vaseCloud.material.dispose();
            repairCloud.geometry.dispose();
            repairCloud.material.dispose();
            dot.dispose();
            renderer.dispose();
            canvas.remove();
        };
        window.addEventListener('pagehide', destroy, { once: true });
        stage.kintsugiDestroy = destroy;
    }
}


/* ------------------------------------------------------------- helpers */

function hasWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext
            && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (err) {
        return false;
    }
}

/* A disc drawn once and shared by both clouds, so a point is round, not square. */
function circleTexture(THREE) {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.7, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(c);
}

function surfaceArea(entry) {
    const p = entry.geometry.getAttribute('position').array;
    let area = 0;
    for (let i = 0; i + 8 < p.length; i += 9) {
        const ux = p[i + 3] - p[i];
        const uy = p[i + 4] - p[i + 1];
        const uz = p[i + 5] - p[i + 2];
        const vx = p[i + 6] - p[i];
        const vy = p[i + 7] - p[i + 1];
        const vz = p[i + 8] - p[i + 2];
        area += 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    }
    return area;
}

function disposeScene(root) {
    root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        for (const m of mats) {
            for (const k of Object.keys(m)) {
                const v = m[k];
                if (v && v.isTexture) v.dispose();
            }
            m.dispose();
        }
    });
}

const clamp = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
