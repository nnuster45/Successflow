// Process Demonstration: plays the illustrated story scene by scene.
(function () {
    const root = document.querySelector('[data-sfs]');
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const SCENE_MS = 5500;
    const stage = root.querySelector('[data-sfs-stage]');
    const frame = root.querySelector('[data-sfs-frame]');
    const scenes = Array.from(root.querySelectorAll('[data-sfs-scene]'));
    const captions = Array.from(root.querySelectorAll('[data-sfs-caption]'));
    const tabs = Array.from(root.querySelectorAll('[data-sfs-tab]'));
    const playButton = root.querySelector('[data-sfs-play]');
    const iconPause = root.querySelector('[data-sfs-icon-pause]');
    const iconPlay = root.querySelector('[data-sfs-icon-play]');

    let current = 0;
    let playing = !reduceMotion.matches;
    let inView = false;
    let timer = null;
    let barAnim = null;

    function show(index) {
        current = (index + scenes.length) % scenes.length;
        scenes.forEach((scene, i) => {
            const active = i === current;
            scene.classList.toggle('is-active', active);
            scene.hidden = !active;
            if (captions[i]) captions[i].hidden = !active;
        });
        tabs.forEach((tab, i) => {
            tab.classList.toggle('is-active', i === current);
            tab.classList.toggle('is-done', i < current);
            tab.setAttribute('aria-selected', i === current ? 'true' : 'false');
        });
        stage.style.backgroundColor = scenes[current].getAttribute('data-bg');
        schedule();
    }

    function schedule() {
        clearTimeout(timer);
        if (barAnim) {
            barAnim.cancel();
            barAnim = null;
        }
        const bar = tabs[current].querySelector('.sfs-tab-bar span');
        if (!playing || !inView) return;
        if (bar && bar.animate) {
            barAnim = bar.animate([{ width: '0%' }, { width: '100%' }], { duration: SCENE_MS, easing: 'linear', fill: 'forwards' });
        }
        timer = setTimeout(() => show(current + 1), SCENE_MS);
    }

    function setPlaying(next) {
        playing = next;
        playButton.setAttribute('aria-pressed', playing ? 'true' : 'false');
        playButton.setAttribute('aria-label', playing ? 'หยุด' : 'เล่นอัตโนมัติ');
        iconPause.style.display = playing ? '' : 'none';
        iconPlay.style.display = playing ? 'none' : '';
        schedule();
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

    playButton.addEventListener('click', () => setPlaying(!playing));

    // Start the story from the first scene whenever it scrolls into view.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const was = inView;
                inView = entry.isIntersecting;
                if (inView && !was) show(current);
                else if (!inView) schedule();
            });
        }, { threshold: 0.35 }).observe(root);
    } else {
        inView = true;
    }

    if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener('change', () => setPlaying(!reduceMotion.matches));
    }

    // The illustration is drawn on a fixed 800px canvas; scale it to the card width.
    function fit() {
        frame.style.setProperty('--s', String(frame.clientWidth / 800));
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
    else window.addEventListener('resize', fit);
    fit();

    setPlaying(playing);
    show(0);
})();
