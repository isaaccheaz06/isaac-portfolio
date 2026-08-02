const navbar = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 80) {
        navbar.classList.add('navbar-hidden');
    } else if (currentScrollY <= 0) {
        navbar.classList.remove('navbar-hidden');
    }

    lastScrollY = currentScrollY;
});

const phoneButton = document.querySelector("#phone-button");
const phoneButtonText = document.querySelector("#phone-button-text");

let phoneNumberIsVisible = false;

phoneButton.addEventListener("click", () => {
    const displayNumber = phoneButton.dataset.displayNumber;
    const phoneNumber = phoneButton.dataset.phoneNumber;

    if (!phoneNumberIsVisible) {
        phoneButtonText.classList.add("changing");

        window.setTimeout(() => {
            phoneButtonText.textContent = displayNumber;
            phoneButton.classList.add("revealed");
            phoneButtonText.classList.remove("changing");
            phoneButton.setAttribute(
                "aria-label",
                `Text ${displayNumber}. Click again to open your messaging app.`
            );

            phoneNumberIsVisible = true;
        }, 180);

        return;
    }

    window.location.href = `sms:${phoneNumber}`;
});