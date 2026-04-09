(function () {
    'use strict';

    const STATUS_OBSERVERS = new WeakMap();

    function enhanceRatioOutput(outputId, rangeId) {
        const output = document.getElementById(outputId);
        const range = document.getElementById(rangeId);
        if (!output || !range) return;

        if (output.tagName !== 'OUTPUT') {
            const outputEl = document.createElement('output');
            outputEl.id = output.id;
            outputEl.className = output.className;
            outputEl.htmlFor = rangeId;
            outputEl.textContent = output.textContent;
            output.replaceWith(outputEl);
        }

        const liveOutput = document.getElementById(outputId);
        if (!liveOutput) return;
        liveOutput.htmlFor = rangeId;

        if (range.dataset.phase7Bound === 'true') return;
        range.addEventListener('input', () => {
            liveOutput.value = `${range.value}% : ${100 - Number(range.value)}%`;
            liveOutput.textContent = liveOutput.value;
        });
        range.dispatchEvent(new Event('input', { bubbles: true }));
        range.dataset.phase7Bound = 'true';
    }

    function enhanceMediaDisclosure(fieldset) {
        if (!fieldset || fieldset.dataset.phase7Disclosure === 'true') return;
        const legend = fieldset.querySelector('legend');
        if (!legend || legend.textContent.trim() !== '미디어') return;

        const disclosure = document.createElement('details');
        disclosure.className = 'phase7-disclosure';
        disclosure.open = true;

        const summary = document.createElement('summary');
        summary.innerHTML = '<span>미디어 설정</span><span>열기/닫기</span>';

        const body = document.createElement('div');
        body.className = 'phase7-disclosure-body';

        Array.from(fieldset.children).forEach((child) => {
            if (child === legend) return;
            body.appendChild(child);
        });

        disclosure.appendChild(summary);
        disclosure.appendChild(body);
        legend.replaceWith(disclosure);
        fieldset.dataset.phase7Disclosure = 'true';
    }

    function ensureStatusProgress(statusEl) {
        if (!statusEl || statusEl.dataset.phase7Progress === 'true') return;

        const row = document.createElement('div');
        row.className = 'phase7-progress-row';

        const progress = document.createElement('progress');
        progress.className = 'phase7-status-progress';
        progress.max = 100;
        progress.removeAttribute('value');

        const output = document.createElement('output');
        output.className = 'phase7-status-output';
        output.textContent = statusEl.textContent.trim();

        row.appendChild(progress);
        row.appendChild(output);
        statusEl.before(row);
        statusEl.dataset.phase7Progress = 'true';

        const sync = () => {
            const state = statusEl.dataset.state || 'idle';
            const active = state === 'uploading' || state === 'processing';
            row.classList.toggle('is-active', active);
            output.value = statusEl.textContent.trim();
            output.textContent = output.value;
            progress.toggleAttribute('value', !active);
        };

        sync();

        const observer = new MutationObserver(sync);
        observer.observe(statusEl, { attributes: true, attributeFilter: ['data-state'], childList: true, characterData: true, subtree: true });
        STATUS_OBSERVERS.set(statusEl, observer);
    }

    function applyPhase7Enhancements() {
        document.querySelectorAll('.phase6-fieldset').forEach((fieldset) => enhanceMediaDisclosure(fieldset));
        enhanceRatioOutput('input-ratio-text', 'input-text-ratio');
        enhanceRatioOutput('edit-ratio-text', 'edit-text-ratio');
        document.querySelectorAll('.file-upload-status').forEach((statusEl) => ensureStatusProgress(statusEl));
    }

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        applyPhase7Enhancements();
    };

    applyPhase7Enhancements();
})();
