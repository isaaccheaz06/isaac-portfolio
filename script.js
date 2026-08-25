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
