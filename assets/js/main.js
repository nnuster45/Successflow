if (typeof AOS !== 'undefined') {
    AOS.init({
        duration: 900,
        once: true,
        offset: 80,
    });
}

const setupSliderControls = (sliderId, prevId, nextId, gap = 24, fallbackWidth = 320) => {
    const slider = document.getElementById(sliderId);
    const prevButton = document.getElementById(prevId);
    const nextButton = document.getElementById(nextId);

    if (!slider || !prevButton || !nextButton) return;

    const scrollSlider = (direction) => {
        const firstCard = slider.firstElementChild;
        const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : fallbackWidth;

        slider.scrollBy({
            left: direction * (cardWidth + gap),
            behavior: 'smooth',
        });
    };

    prevButton.addEventListener('click', () => scrollSlider(-1));
    nextButton.addEventListener('click', () => scrollSlider(1));
};

setupSliderControls('services-slider', 'services-prev', 'services-next', 24, 320);
setupSliderControls('portfolio-slider', 'portfolio-prev', 'portfolio-next', 32, 520);
