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
        const firstCard = slider.querySelector('.snap-start');
        const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : fallbackWidth;

        slider.scrollBy({
            left: direction * (cardWidth + gap),
            behavior: 'smooth',
        });
    };

    prevButton.addEventListener('click', () => scrollSlider(-1));
    nextButton.addEventListener('click', () => scrollSlider(1));
};

setupSliderControls('problem-slider', 'problem-prev', 'problem-next', 20, 320);
setupSliderControls('services-slider', 'services-prev', 'services-next', 24, 320);
setupSliderControls('portfolio-slider', 'portfolio-prev', 'portfolio-next', 32, 520);

const contactForm = document.getElementById('contact-form');
const contactSubmitButton = document.getElementById('contact-submit');
const contactModal = document.getElementById('contact-modal');
const contactModalTitle = document.getElementById('contact-modal-title');
const contactModalMessage = document.getElementById('contact-modal-message');
const contactModalIcon = document.getElementById('contact-modal-icon');
const contactModalClose = document.getElementById('contact-modal-close');

const modalText = {
    success: {
        title: { th: 'ส่งข้อมูลเรียบร้อย', en: 'Message Sent Successfully' },
        message: { th: 'เราได้รับข้อมูลของคุณแล้ว และจะติดต่อกลับโดยเร็วที่สุด', en: 'We received your details and will get back to you as soon as possible.' },
        icon: '✓',
    },
    error: {
        title: { th: 'ส่งข้อมูลไม่สำเร็จ', en: 'Unable To Send Message' },
        message: { th: 'กรุณาลองใหม่อีกครั้ง หรือติดต่อผ่าน LINE, โทรศัพท์ หรืออีเมลด้านล่างแทน', en: 'Please try again, or contact us via LINE, phone, or email instead.' },
        icon: '!',
    },
};

const getCurrentLang = () => document.documentElement.lang === 'en' ? 'en' : 'th';

const openContactModal = (state) => {
    if (!contactModal) return;
    const lang = getCurrentLang();
    contactModalTitle.textContent = modalText[state].title[lang];
    contactModalMessage.textContent = modalText[state].message[lang];
    contactModalIcon.textContent = modalText[state].icon;
    contactModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

const closeContactModal = () => {
    if (!contactModal) return;
    contactModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
};

if (contactModal) {
    contactModal.addEventListener('click', (event) => {
        if (event.target.matches('[data-close-modal]')) {
            closeContactModal();
        }
    });
}

if (contactModalClose) {
    contactModalClose.addEventListener('click', closeContactModal);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeContactModal();
    }
});

if (contactForm && contactSubmitButton) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const originalText = contactSubmitButton.textContent;
        contactSubmitButton.disabled = true;
        contactSubmitButton.textContent = getCurrentLang() === 'en' ? 'Sending...' : 'กำลังส่ง...';

        const formData = new FormData(contactForm);
        const payload = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('https://n8n.drugnoti.xyz/webhook/c4b1aa14-49de-4c0a-8da7-dd59d27522d5', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Form submission failed');
            }

            contactForm.reset();
            openContactModal('success');
        } catch (error) {
            openContactModal('error');
        } finally {
            contactSubmitButton.disabled = false;
            contactSubmitButton.textContent = originalText;
        }
    });
}
