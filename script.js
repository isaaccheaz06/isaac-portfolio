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
