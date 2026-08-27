const navbar = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 80) {
        navbar.classList.add('navbar-hidden');
    } else if (currentScrollY < lastScrollY) {
        navbar.classList.remove('navbar-hidden');
    }

    lastScrollY = currentScrollY;
});

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

const hero = document.querySelector('.hero');

if (hero && !reduceMotion.matches && !coarsePointer.matches) {
    // spacing, not a timer — ties ripple density to how fast the cursor
    // is actually moving instead of firing on a fixed interval
    const RIPPLE_SPACING = 46;
    let lastX = null;
    let lastY = null;

    const spawnRipple = (x, y) => {
        const ripple = document.createElement('span');
        ripple.className = 'cursor-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        hero.appendChild(ripple);

        const animation = ripple.animate(
            [
                { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0.5 },
                { transform: 'translate(-50%, -50%) scale(1.8)', opacity: 0 },
            ],
            { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );

        animation.onfinish = () => ripple.remove();
    };

    hero.addEventListener('mousemove', (event) => {
        const bounds = hero.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;

        if (lastX !== null && Math.hypot(x - lastX, y - lastY) < RIPPLE_SPACING) {
            return;
        }

        lastX = x;
        lastY = y;
        spawnRipple(x, y);
    });

    hero.addEventListener('mouseleave', () => {
        lastX = null;
        lastY = null;
    });
}
