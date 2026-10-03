// Story demos: play each illustrated story scene by scene while it is on screen.
// A page can hold several; a one-scene demo (a vignette) simply replays its scene.
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const SCENE_MS = 5500;

    function isEnglish() {
        return document.documentElement.lang === 'en';
    }

    function setup(root) {
        const stage = root.querySelector('[data-sfs-stage]');
        const frame = root.querySelector('[data-sfs-frame]');
        const scenes = Array.from(root.querySelectorAll('[data-sfs-scene]'));
        const captions = Array.from(root.querySelectorAll('[data-sfs-caption]'));
        const tabs = Array.from(root.querySelectorAll('[data-sfs-tab]'));
        const sceneMs = Number(root.getAttribute('data-sfs-ms')) || SCENE_MS;

        let current = 0;
        let inView = false;
        let hovering = false;
        let timer = null;
        let barAnim = null;

        function playing() {
            return inView && !hovering && !reduceMotion.matches;
        }

        function show(index) {
            current = (index + scenes.length) % scenes.length;
            scenes.forEach((scene, i) => {
                scene.classList.remove('is-active');
                scene.hidden = i !== current;
                if (captions[i]) captions[i].hidden = i !== current;
            });
            // Re-adding the class on the next frame restarts the scene's CSS animations.
            void scenes[current].offsetWidth;
            scenes[current].classList.add('is-active');
            tabs.forEach((tab, i) => {
                tab.classList.toggle('is-active', i === current);
                tab.classList.toggle('is-done', i < current);
                tab.setAttribute('aria-selected', i === current ? 'true' : 'false');
            });
            const bg = scenes[current].getAttribute('data-bg');
            if (bg) stage.style.backgroundColor = bg;
            schedule();
        }

        function schedule() {
            clearTimeout(timer);
            if (barAnim) {
                barAnim.cancel();
                barAnim = null;
            }
            if (!playing()) return;
            const bar = tabs[current] && tabs[current].querySelector('.sfs-tab-bar span');
            if (bar && bar.animate) {
                barAnim = bar.animate([{ width: '0%' }, { width: '100%' }], { duration: sceneMs, easing: 'linear', fill: 'forwards' });
            }
            timer = setTimeout(() => show(current + 1), sceneMs);
        }

        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => show(i));
            tab.addEventListener('keydown', (event) => {
                if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
                event.preventDefault();
                const next = (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                tabs[next].focus();
                show(next);
            });
        });

        // Hold the current scene while the pointer rests on the illustration.
        frame.addEventListener('mouseenter', () => { hovering = true; schedule(); });
        frame.addEventListener('mouseleave', () => { hovering = false; schedule(); });

        // Start the story from the first scene whenever it scrolls into view.
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const was = inView;
                    inView = entry.isIntersecting;
                    if (inView && !was) show(scenes.length > 1 ? current : 0);
                    else if (!inView) schedule();
                });
            }, { threshold: 0.35 }).observe(root);
        } else {
            inView = true;
        }

        if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', schedule);

        // English: pages with a TH/EN switch ship a dictionary of the story's Thai strings,
        // swapped in place whenever i18n.js sets <html lang>.
        const dictionary = root.querySelector('script[data-sfs-en]');
        if (dictionary) {
            const en = JSON.parse(dictionary.textContent);
            const texts = [];
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const node = walker.currentNode;
                const key = node.nodeValue.trim();
                if (key && en[key]) texts.push({ node, th: node.nodeValue, en: node.nodeValue.replace(key, en[key]) });
            }
            const labels = Array.from(root.querySelectorAll('[aria-label]'))
                .filter((el) => en[el.getAttribute('aria-label')])
                .map((el) => ({ el, th: el.getAttribute('aria-label'), en: en[el.getAttribute('aria-label')] }));
            const applyLanguage = () => {
                const english = isEnglish();
                texts.forEach((t) => { t.node.nodeValue = english ? t.en : t.th; });
                labels.forEach((l) => l.el.setAttribute('aria-label', english ? l.en : l.th));
            };
            new MutationObserver(applyLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
            applyLanguage();
        }

        // The illustration is drawn on a fixed 800px-wide canvas; scale it to the card width.
        function fit() {
            frame.style.setProperty('--s', String(frame.clientWidth / 800));
        }
        if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
        else window.addEventListener('resize', fit);
        fit();

        show(0);
    }

    document.querySelectorAll('[data-sfs]').forEach(setup);
})();
