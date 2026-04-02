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

    const getVisibleCard = () => Array.from(slider.querySelectorAll('.snap-start')).find((card) => !card.classList.contains('is-hidden'));

    const scrollSlider = (direction) => {
        const firstCard = getVisibleCard();
        const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : fallbackWidth;

        slider.scrollBy({
            left: direction * (cardWidth + gap),
            behavior: 'smooth',
        });
    };

    prevButton.addEventListener('click', () => scrollSlider(-1));
    nextButton.addEventListener('click', () => scrollSlider(1));
};

const setupFilters = () => {
    document.querySelectorAll('[data-filter-group]').forEach((group) => {
        const groupName = group.getAttribute('data-filter-group');
        const buttons = group.querySelectorAll('[data-filter]');
        const items = document.querySelectorAll(`[data-filter-item="${groupName}"]`);
        const slider = document.getElementById(`${groupName}-slider`);

        if (!buttons.length || !items.length) return;

        const applyFilter = (value) => {
            buttons.forEach((button) => {
                button.classList.toggle('is-active', button.getAttribute('data-filter') === value);
            });

            items.forEach((item) => {
                const categories = (item.getAttribute('data-category') || '').split(/\s+/).filter(Boolean);
                const show = value === 'all' || categories.includes(value);
                item.classList.toggle('is-hidden', !show);
            });

            if (slider) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            }
        };

        buttons.forEach((button) => {
            button.addEventListener('click', () => applyFilter(button.getAttribute('data-filter') || 'all'));
        });
    });
};

const setupGifCarousels = () => {
    document.querySelectorAll('[data-gif-carousel]').forEach((carousel) => {
        const track = carousel.querySelector('[data-gif-track]');
        const prev = carousel.querySelector('[data-gif-prev]');
        const next = carousel.querySelector('[data-gif-next]');
        const slides = Array.from(track?.querySelectorAll('.order-showcase-slide') || []);

        if (!track || !prev || !next || slides.length <= 1) return;

        let currentIndex = 0;
        let wheelLocked = false;
        let wheelDeltaX = 0;
        let wheelResetTimer = null;

        const render = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        };

        const goTo = (index) => {
            currentIndex = (index + slides.length) % slides.length;
            render();
        };

        prev.addEventListener('click', () => goTo(currentIndex - 1));
        next.addEventListener('click', () => goTo(currentIndex + 1));

        let touchStartX = null;

        track.addEventListener('touchstart', (event) => {
            touchStartX = event.changedTouches[0]?.clientX ?? null;
        }, { passive: true });

        track.addEventListener('touchend', (event) => {
            const touchEndX = event.changedTouches[0]?.clientX ?? null;
            if (touchStartX === null || touchEndX === null) return;

            const deltaX = touchEndX - touchStartX;
            touchStartX = null;

            if (Math.abs(deltaX) < 48) return;

            if (deltaX < 0) {
                goTo(currentIndex + 1);
            } else {
                goTo(currentIndex - 1);
            }
        }, { passive: true });

        carousel.addEventListener('wheel', (event) => {
            const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 18;
            if (!horizontalIntent || wheelLocked) return;

            event.preventDefault();
            wheelDeltaX += event.deltaX;

            window.clearTimeout(wheelResetTimer);
            wheelResetTimer = window.setTimeout(() => {
                wheelDeltaX = 0;
            }, 140);

            if (Math.abs(wheelDeltaX) < 70) return;

            wheelLocked = true;
            window.setTimeout(() => {
                wheelLocked = false;
            }, 520);

            if (wheelDeltaX > 0) {
                goTo(currentIndex + 1);
            } else {
                goTo(currentIndex - 1);
            }

            wheelDeltaX = 0;
        }, { passive: false });

        render();
    });
};

const refreshProjectCarouselHeights = (targetCarousel = null) => {
    const carousels = targetCarousel ? [targetCarousel] : Array.from(document.querySelectorAll('[data-project-carousel]'));
    carousels.forEach((carousel) => {
        const stage = carousel.querySelector('.project-carousel-stage');
        const slides = Array.from(carousel.querySelectorAll('[data-project-slide]'));
        if (!stage || !slides.length) return;

        let maxHeight = 0;
        slides.forEach((slide) => {
            maxHeight = Math.max(maxHeight, slide.offsetHeight);
        });

        if (maxHeight > 0) {
            stage.style.minHeight = `${maxHeight}px`;
        }
    });
};

const setupProjectSwitchers = () => {
    document.querySelectorAll('[data-project-carousel]').forEach((carousel) => {
        const stage = carousel.querySelector('.project-carousel-stage');
        const slides = Array.from(carousel.querySelectorAll('[data-project-slide]'));
        const prevButtons = Array.from(carousel.querySelectorAll('[data-project-prev]'));
        const nextButtons = Array.from(carousel.querySelectorAll('[data-project-next]'));
        const counter = carousel.querySelector('[data-project-counter]');

        if (!stage || !slides.length || !prevButtons.length || !nextButtons.length) return;

        let currentIndex = 0;
        let touchStartX = null;
        let wheelLocked = false;
        let wheelDeltaX = 0;
        let wheelResetTimer = null;

        let track = stage.querySelector('.project-carousel-track');
        if (!track) {
            track = document.createElement('div');
            track.className = 'project-carousel-track';
            slides.forEach((slide) => {
                track.appendChild(slide);
                slide.classList.remove('hidden');
            });
            stage.appendChild(track);
        }

        if (slides.length <= 1) {
            carousel.classList.add('is-single-project');
        }
        if (!carousel.dataset.mobileDetailsExpanded) {
            carousel.dataset.mobileDetailsExpanded = 'false';
        }

        const syncMobileCollapseState = () => {
            if (!window.matchMedia('(max-width: 767px)').matches) return;
            const mobileDetailsExpanded = carousel.dataset.mobileDetailsExpanded === 'true';

            slides.forEach((slide) => {
                const wrapper = slide.querySelector('.service-project-collapse');
                const button = wrapper?.querySelector('.service-project-collapse-toggle');
                const panel = wrapper?.querySelector('.service-project-collapse-panel');
                if (!wrapper || !button || !panel) return;

                wrapper.classList.toggle('is-open', mobileDetailsExpanded);
                button.setAttribute('aria-expanded', String(mobileDetailsExpanded));
                panel.style.maxHeight = mobileDetailsExpanded ? `${panel.scrollHeight}px` : '0px';
                panel.style.opacity = mobileDetailsExpanded ? '1' : '0';
                panel.style.marginTop = mobileDetailsExpanded ? '0.75rem' : '0';
            });
        };

        const goTo = (index) => {
            const normalizedIndex = (index + slides.length) % slides.length;
            currentIndex = normalizedIndex;
            render();
        };

        const render = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;

            if (counter) {
                counter.textContent = `${currentIndex + 1} / ${slides.length}`;
            }

            syncMobileCollapseState();
            refreshProjectCarouselHeights(carousel);
        };

        prevButtons.forEach((button) => {
            button.addEventListener('click', () => {
                goTo(currentIndex - 1);
            });
        });

        nextButtons.forEach((button) => {
            button.addEventListener('click', () => {
                goTo(currentIndex + 1);
            });
        });

        stage.addEventListener('touchstart', (event) => {
            touchStartX = event.changedTouches[0]?.clientX ?? null;
        }, { passive: true });

        stage.addEventListener('touchend', (event) => {
            const touchEndX = event.changedTouches[0]?.clientX ?? null;
            if (touchStartX === null || touchEndX === null) return;

            const deltaX = touchEndX - touchStartX;
            touchStartX = null;

            if (Math.abs(deltaX) < 48) return;

            if (deltaX < 0) {
                goTo(currentIndex + 1);
            } else {
                goTo(currentIndex - 1);
            }
        }, { passive: true });

        stage.addEventListener('wheel', (event) => {
            const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 18;
            if (!horizontalIntent || wheelLocked || slides.length <= 1) return;

            event.preventDefault();
            wheelDeltaX += event.deltaX;

            window.clearTimeout(wheelResetTimer);
            wheelResetTimer = window.setTimeout(() => {
                wheelDeltaX = 0;
            }, 140);

            if (Math.abs(wheelDeltaX) < 70) return;

            wheelLocked = true;
            window.setTimeout(() => {
                wheelLocked = false;
            }, 520);

            if (wheelDeltaX > 0) {
                goTo(currentIndex + 1);
            } else {
                goTo(currentIndex - 1);
            }

            wheelDeltaX = 0;
        }, { passive: false });

        render();
        window.addEventListener('resize', () => {
            syncMobileCollapseState();
            refreshProjectCarouselHeights(carousel);
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        });
    });
};

const setupServiceProjectAccordions = () => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    const syncCollapsePanel = (wrapper, expand) => {
        const panel = wrapper.querySelector('.service-project-collapse-panel');
        if (!panel) return;

        if (expand) {
            panel.style.maxHeight = `${panel.scrollHeight}px`;
            panel.style.opacity = '1';
            panel.style.marginTop = '0.75rem';
        } else {
            panel.style.maxHeight = '0px';
            panel.style.opacity = '0';
            panel.style.marginTop = '0';
        }
    };

    document.querySelectorAll('[data-project-carousel] [data-project-slide] .grid.gap-3').forEach((group) => {
        if (!group.dataset.collapseReady) {
            const parent = group.parentElement;
            if (!parent) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'service-project-collapse';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'service-project-collapse-toggle';
            button.innerHTML = `
                <span class="service-project-collapse-label">ดูรายละเอียดเพิ่มเติม</span>
                <span class="service-project-collapse-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none" class="service-project-collapse-icon-svg">
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            `;

            const panel = document.createElement('div');
            panel.className = 'service-project-collapse-panel';

            parent.insertBefore(wrapper, group);
            wrapper.appendChild(button);
            wrapper.appendChild(panel);
            panel.appendChild(group);
            group.dataset.collapseReady = 'true';

            button.addEventListener('click', () => {
                if (!window.matchMedia('(max-width: 767px)').matches) return;

                const nextState = !wrapper.classList.contains('is-open');
                const carousel = wrapper.closest('[data-project-carousel]');
                if (carousel) {
                    carousel.dataset.mobileDetailsExpanded = String(nextState);
                }
                const allWrappers = Array.from((carousel || document).querySelectorAll('.service-project-collapse'));
                allWrappers.forEach((item) => {
                    const itemButton = item.querySelector('.service-project-collapse-toggle');
                    item.classList.toggle('is-open', nextState);
                    if (itemButton) {
                        itemButton.setAttribute('aria-expanded', String(nextState));
                    }
                    syncCollapsePanel(item, nextState);
                });
                if (carousel) {
                    window.requestAnimationFrame(() => refreshProjectCarouselHeights(carousel));
                }
            });

            panel.addEventListener('transitionend', (event) => {
                if (event.propertyName !== 'max-height') return;
                if (wrapper.classList.contains('is-open')) {
                    panel.style.maxHeight = `${panel.scrollHeight}px`;
                }
                const carousel = wrapper.closest('[data-project-carousel]');
                refreshProjectCarouselHeights(carousel);
            });
        }

        const wrapper = group.closest('.service-project-collapse');
        const button = wrapper?.querySelector('.service-project-collapse-toggle');
        if (!wrapper || !button) return;

        if (isMobile) {
            if (wrapper.dataset.mobileReady !== 'true') {
                const carousel = wrapper.closest('[data-project-carousel]');
                if (carousel && !carousel.dataset.mobileDetailsExpanded) {
                    carousel.dataset.mobileDetailsExpanded = 'false';
                }
                wrapper.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
                syncCollapsePanel(wrapper, false);
                wrapper.dataset.mobileReady = 'true';
            }
        } else {
            wrapper.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
            syncCollapsePanel(wrapper, true);
            wrapper.dataset.mobileReady = 'false';
        }
    });

    window.requestAnimationFrame(() => refreshProjectCarouselHeights());
};

document.addEventListener('DOMContentLoaded', setupGifCarousels);
document.addEventListener('DOMContentLoaded', setupFilters);
document.addEventListener('DOMContentLoaded', setupProjectSwitchers);
document.addEventListener('DOMContentLoaded', setupServiceProjectAccordions);
window.addEventListener('resize', setupServiceProjectAccordions);

const openGifModal = (src) => {
    const modal = document.getElementById("gif-modal");
    const img = document.getElementById("gif-modal-img");

    if (!modal || !img) return;

    img.src = src;
    modal.classList.remove("hidden");
};

const closeGifModal = () => {
    document.getElementById("gif-modal")?.classList.add("hidden");
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
const contactFormError = document.getElementById('contact-form-error');

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

const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}

if (contactForm && contactSubmitButton) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const phoneInput = contactForm.querySelector('input[name="phone"]');
        const emailInput = contactForm.querySelector('input[name="email"]');
        const hasPhone = Boolean(phoneInput?.value.trim());
        const hasEmail = Boolean(emailInput?.value.trim());

        if (!hasPhone && !hasEmail) {
            if (contactFormError) {
                contactFormError.classList.remove('hidden');
            }
            phoneInput?.focus();
            return;
        }

        if (contactFormError) {
            contactFormError.classList.add('hidden');
        }

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
