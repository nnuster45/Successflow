// Process Demonstration showcase: animated walkthrough of the accounting workflow.
(function () {
    const root = document.querySelector('[data-afd]');
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const STEP_MS = 5200;
    const flow = root.querySelector('[data-afd-flow]');
    const svg = root.querySelector('[data-afd-wires]');
    const core = root.querySelector('[data-afd-core]');
    const sources = Array.from(root.querySelectorAll('[data-afd-source]'));
    const outputs = Array.from(root.querySelectorAll('[data-afd-output]'));
    const steps = Array.from(root.querySelectorAll('[data-afd-step]'));
    const panels = Array.from(root.querySelectorAll('[data-afd-panel]'));
    const toggle = root.querySelector('[data-afd-toggle]');
    const toggleLabel = root.querySelector('[data-afd-toggle-label]');
    const path = root.querySelector('[data-afd-pathbar]');

    // Which nodes light up on each step.
    const STAGES = [
        { sources: 'all', outputs: [], inFlow: true, outFlow: false },
        { sources: ['slip', 'bank'], outputs: [], inFlow: true, outFlow: false },
        { sources: [], outputs: [], inFlow: true, outFlow: true },
        { sources: [], outputs: ['exception'], inFlow: false, outFlow: true },
        { sources: [], outputs: ['invoice', 'commission', 'ledger'], inFlow: false, outFlow: true }
    ];

    const wires = [];
    let current = 0;
    let playing = !reduceMotion.matches;
    let inView = false;
    let timer = null;
    let barAnim = null;

    function svgEl(tag, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));
        return el;
    }

    function anchor(rect, base, side) {
        const x = rect.left - base.left;
        const y = rect.top - base.top;
        if (side === 'right') return [x + rect.width, y + rect.height / 2];
        if (side === 'left') return [x, y + rect.height / 2];
        if (side === 'bottom') return [x + rect.width / 2, y + rect.height];
        return [x + rect.width / 2, y];
    }

    function curve(a, b, horizontal) {
        if (horizontal) {
            const mx = (a[0] + b[0]) / 2;
            return `M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}`;
        }
        const my = (a[1] + b[1]) / 2;
        return `M${a[0]},${a[1]} C${a[0]},${my} ${b[0]},${my} ${b[0]},${b[1]}`;
    }

    function drawWires() {
        const base = flow.getBoundingClientRect();
        const coreRect = core.getBoundingClientRect();
        const horizontal = coreRect.left > sources[0].getBoundingClientRect().right;
        svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
        svg.innerHTML = '';
        wires.length = 0;

        const defs = svgEl('defs', {});
        const grad = svgEl('linearGradient', { id: 'afd-grad', x1: '0', y1: '0', x2: '1', y2: '1' });
        grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#60a5fa' }));
        grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#22d3ee' }));
        defs.appendChild(grad);
        svg.appendChild(defs);

        const add = (node, a, b, dir) => {
            const d = curve(a, b, horizontal);
            svg.appendChild(svgEl('path', { d, class: 'afd-wire' }));
            const live = svgEl('path', { d, class: 'afd-wire-flow' });
            const key = node.getAttribute('data-afd-source') || node.getAttribute('data-afd-output');
            live.setAttribute('stroke', key === 'exception' ? '#fbbf24' : (dir === 'out' ? '#34d399' : 'url(#afd-grad)'));
            svg.appendChild(live);
            wires.push({ el: live, key, dir });
        };

        sources.forEach((node) => {
            const r = node.getBoundingClientRect();
            add(node, anchor(r, base, horizontal ? 'right' : 'bottom'), anchor(coreRect, base, horizontal ? 'left' : 'top'), 'in');
        });
        outputs.forEach((node) => {
            const r = node.getBoundingClientRect();
            add(node, anchor(coreRect, base, horizontal ? 'right' : 'bottom'), anchor(r, base, horizontal ? 'left' : 'top'), 'out');
        });
        paintStage();
    }

    function paintStage() {
        const stage = STAGES[current];
        const hotSource = (key) => stage.sources === 'all' || stage.sources.includes(key);
        sources.forEach((node) => node.classList.toggle('is-hot', hotSource(node.getAttribute('data-afd-source'))));
        outputs.forEach((node) => node.classList.toggle('is-hot', stage.outputs.includes(node.getAttribute('data-afd-output'))));
        wires.forEach((wire) => {
            let on;
            if (wire.dir === 'in') {
                on = stage.inFlow && (stage.sources === 'all' || stage.sources.length === 0 || stage.sources.includes(wire.key));
            } else {
                on = stage.outFlow && (stage.outputs.length === 0 ? wire.key !== 'exception' : stage.outputs.includes(wire.key));
            }
            wire.el.classList.toggle('is-on', on);
        });
    }

    function countUp(el) {
        const target = Number(el.getAttribute('data-afd-count'));
        if (reduceMotion.matches) {
            el.textContent = target.toLocaleString('en-US');
            return;
        }
        const start = performance.now();
        const duration = Number(el.getAttribute('data-afd-duration') || 2200);
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased).toLocaleString('en-US');
            if (t < 1 && el.isConnected) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    function show(index) {
        current = (index + steps.length) % steps.length;
        steps.forEach((step, i) => {
            step.classList.toggle('is-active', i === current);
            step.classList.toggle('is-done', i < current);
            step.setAttribute('aria-selected', i === current ? 'true' : 'false');
            const bar = step.querySelector('.afd-step-bar');
            if (bar && i !== current) bar.style.width = '';
        });
        panels.forEach((panel, i) => {
            const active = i === current;
            panel.classList.toggle('is-active', active);
            panel.hidden = !active;
            if (active) panel.querySelectorAll('[data-afd-count]').forEach(countUp);
        });
        path.textContent = steps[current].getAttribute('data-afd-path');
        paintStage();
        schedule();
    }

    function schedule() {
        clearTimeout(timer);
        if (barAnim) barAnim.cancel();
        const bar = steps[current].querySelector('.afd-step-bar');
        if (!playing || !inView) {
            if (bar) bar.style.width = playing ? '0' : '100%';
            return;
        }
        if (bar && bar.animate) {
            barAnim = bar.animate([{ width: '0%' }, { width: '100%' }], { duration: STEP_MS, easing: 'linear', fill: 'forwards' });
        }
        timer = setTimeout(() => show(current + 1), STEP_MS);
    }

    function setPlaying(next) {
        playing = next;
        toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
        toggleLabel.textContent = playing ? 'หยุด' : 'เล่นอัตโนมัติ';
        root.querySelector('[data-afd-icon-pause]').style.display = playing ? '' : 'none';
        root.querySelector('[data-afd-icon-play]').style.display = playing ? 'none' : '';
        schedule();
    }

    steps.forEach((step, i) => {
        step.addEventListener('click', () => {
            show(i);
        });
        step.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                const next = (i + (event.key === 'ArrowRight' ? 1 : -1) + steps.length) % steps.length;
                steps[next].focus();
                show(next);
            }
        });
    });

    toggle.addEventListener('click', () => setPlaying(!playing));

    // Only run the loop while the showcase is on screen.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const was = inView;
                inView = entry.isIntersecting;
                if (inView && !was) show(current);
                else if (!inView) schedule();
            });
        }, { threshold: 0.25 }).observe(root);
    } else {
        inView = true;
    }

    reduceMotion.addEventListener && reduceMotion.addEventListener('change', () => setPlaying(!reduceMotion.matches));

    let resizeFrame = null;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(drawWires);
    });

    setPlaying(playing);
    drawWires();
    show(0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWires);
})();
