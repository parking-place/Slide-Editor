// Auto-extracted modular feature: Forms

// --- Extracted from src/html5_phase6.js ---

(function () {
    'use strict';

    function setFieldAttributes() {
        const attributes = [
            ['#input-chapter', { maxlength: '120', autocomplete: 'off', enterkeyhint: 'next' }],
            ['#input-middle-title', { maxlength: '160', autocomplete: 'off', enterkeyhint: 'next' }],
            ['#input-title', { required: 'required', maxlength: '160', autocomplete: 'off', enterkeyhint: 'next' }],
            ['#input-text', { maxlength: '20000', spellcheck: 'false', enterkeyhint: 'done' }],
            ['#input-image-caption', { maxlength: '160', autocomplete: 'off', enterkeyhint: 'done' }],
            ['#edit-chapter', { maxlength: '120', autocomplete: 'off', enterkeyhint: 'next' }],
            ['#edit-middle-title', { maxlength: '160', autocomplete: 'off', enterkeyhint: 'next' }],
            ['#edit-title', { required: 'required', maxlength: '160', autocomplete: 'off', enterkeyhint: 'next' }],
            ['#edit-text', { maxlength: '20000', spellcheck: 'false', enterkeyhint: 'done' }],
            ['#edit-image-caption', { maxlength: '160', autocomplete: 'off', enterkeyhint: 'done' }],
            ['#theme-name-input', { maxlength: '80', autocomplete: 'off', enterkeyhint: 'done' }],
            ['#project-branding-guide-subtitle', { maxlength: '160' }],
            ['#project-branding-footer-copy', { maxlength: '80' }],
            ['#project-modal-name-input', { required: 'required', minlength: '1', maxlength: '120', enterkeyhint: 'done' }]
        ];

        attributes.forEach(([selector, attrs]) => {
            const field = document.querySelector(selector);
            if (!field) return;
            Object.entries(attrs).forEach(([key, value]) => field.setAttribute(key, value));
        });
    }

    function createFieldset(title, nodes) {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'phase6-fieldset';
        const legend = document.createElement('legend');
        legend.textContent = title;
        fieldset.appendChild(legend);
        nodes.filter(Boolean).forEach((node) => fieldset.appendChild(node));
        return fieldset;
    }

    function ensureEditorForm(section) {
        if (!section || section.querySelector(':scope > form.phase6-editor-form')) return;

        const header = section.firstElementChild;
        const button = section.querySelector('.btn-add');
        const inputGroup = section.querySelector('.input-group');
        const textArea = section.querySelector('textarea');
        const mediaWrapper = section.querySelector('.file-upload-wrapper.file-drop-zone');
        const ratioWrapper = section.querySelector('.file-upload-wrapper[id$="layout-ratio-container"]');
        const deleteBlock = section.querySelector('#edit-delete-image')?.parentElement;

        const form = document.createElement('form');
        form.className = 'phase6-editor-form';
        form.autocomplete = 'off';
        form.addEventListener('submit', (event) => event.preventDefault());

        if (header) {
            header.remove();
            section.appendChild(header);
        }

        if (inputGroup) {
            form.appendChild(createFieldset('기본 정보', [inputGroup]));
        }

        if (textArea || mediaWrapper || ratioWrapper || deleteBlock) {
            const composeGrid = document.createElement('div');
            composeGrid.className = 'editor-compose-grid phase6-compose-grid';

            if (textArea) {
                const bodyPane = document.createElement('div');
                bodyPane.className = 'editor-compose-body';
                bodyPane.appendChild(textArea);
                composeGrid.appendChild(bodyPane);
            }

            if (mediaWrapper || ratioWrapper || deleteBlock) {
                if (deleteBlock) {
                    deleteBlock.classList.add('phase6-media-delete');
                }

                const mediaPane = document.createElement('div');
                mediaPane.className = 'editor-compose-media';
                [mediaWrapper, ratioWrapper, deleteBlock].filter(Boolean).forEach((node) => mediaPane.appendChild(node));
                composeGrid.appendChild(mediaPane);
            }

            form.appendChild(createFieldset('?? / ???', [composeGrid]));
        }

        if (button) {
            const footer = document.createElement('div');
            footer.className = 'phase6-form-footer';
            button.remove();
            footer.appendChild(button);
            form.appendChild(footer);
        }

        section.appendChild(form);
    }

    function enhanceEditorForms() {
        document.querySelectorAll('.editor-section').forEach((section) => ensureEditorForm(section));
    }

    function reportEditorValidity(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return true;
        return form.reportValidity();
    }

    const originalInsertNewSlide = window.insertNewSlide;
    window.insertNewSlide = async function (insertIndex) {
        if (!reportEditorValidity('.editor-section:not(.edit-mode) form.phase6-editor-form')) {
            return;
        }
        return originalInsertNewSlide.call(this, insertIndex);
    };

    const originalSaveEditSlide = window.saveEditSlide;
    window.saveEditSlide = async function (index) {
        if (!reportEditorValidity('.editor-section.edit-mode form.phase6-editor-form')) {
            return;
        }
        return originalSaveEditSlide.call(this, index);
    };

    const originalSubmitProjectModalAction = window.submitProjectModalAction;
    window.submitProjectModalAction = async function () {
        const input = document.getElementById('project-modal-name-input');
        const mode = projectModalState?.mode;
        const needsName = ['new', 'saveAs', 'rename'].includes(mode);
        if (needsName && input && !input.reportValidity()) {
            return;
        }
        return originalSubmitProjectModalAction.call(this);
    };

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        setFieldAttributes();
        enhanceEditorForms();
    };

    setFieldAttributes();
})();

// --- Extracted from src/html5_phase7.js ---

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

// --- Extracted from src/html5_phase8.js ---

(function () {
    'use strict';

    const DIALOG_RETURN_FOCUS = new Map();

    function rememberTrigger(dialogId, trigger) {
        if (!dialogId || !trigger) return;
        DIALOG_RETURN_FOCUS.set(dialogId, trigger);
    }

    function restoreFocus(dialogId) {
        const trigger = DIALOG_RETURN_FOCUS.get(dialogId);
        if (trigger && typeof trigger.focus === 'function') {
            trigger.focus();
        }
        DIALOG_RETURN_FOCUS.delete(dialogId);
    }

    function focusDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (!dialog) return;
        const focusable = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        (focusable || dialog).focus();
    }

    function setupDialogAccessibility(dialogId, labelSelector, descriptionSelector) {
        const dialog = document.getElementById(dialogId);
        if (!dialog) return;

        dialog.setAttribute('aria-modal', 'true');

        const labelEl = labelSelector ? dialog.querySelector(labelSelector) : null;
        if (labelEl) {
            if (!labelEl.id) {
                labelEl.id = `${dialogId}-label`;
            }
            dialog.setAttribute('aria-labelledby', labelEl.id);
        }

        const descEl = descriptionSelector ? dialog.querySelector(descriptionSelector) : null;
        if (descEl) {
            if (!descEl.id) {
                descEl.id = `${dialogId}-description`;
            }
            dialog.setAttribute('aria-describedby', descEl.id);
        }

        if (dialog.dataset.phase8Bound === 'true') return;

        dialog.addEventListener('close', () => restoreFocus(dialogId));
        dialog.addEventListener('cancel', () => restoreFocus(dialogId));
        dialog.dataset.phase8Bound = 'true';
    }

    function makeTocItemsKeyboardNavigable() {
        document.querySelectorAll('.toc-nav-title, .toc-nav-middle').forEach((item) => {
            item.tabIndex = 0;
            if (item.dataset.phase8Keybound === 'true') return;
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    item.click();
                }
            });
            item.dataset.phase8Keybound = 'true';
        });
    }

    function addButtonLabels() {
        document.querySelectorAll('button[title]').forEach((button) => {
            button.setAttribute('aria-label', button.getAttribute('title'));
        });
    }

    const originalOpenProjectModal = window.openProjectModal;
    window.openProjectModal = async function (mode = 'open') {
        rememberTrigger('project-modal', document.activeElement);
        await originalOpenProjectModal.call(this, mode);
        focusDialog('project-modal');
    };

    const originalCloseProjectModal = window.closeProjectModal;
    window.closeProjectModal = function () {
        originalCloseProjectModal.call(this);
        restoreFocus('project-modal');
    };

    const originalOpenThemeModal = window.openThemeModal;
    window.openThemeModal = function () {
        rememberTrigger('theme-modal', document.activeElement);
        originalOpenThemeModal.call(this);
        focusDialog('theme-modal');
    };

    const originalCloseThemeModal = window.closeThemeModal;
    window.closeThemeModal = function () {
        originalCloseThemeModal.call(this);
        restoreFocus('theme-modal');
    };

    const originalOpenBrandingModal = window.openBrandingModal;
    window.openBrandingModal = function () {
        rememberTrigger('branding-modal', document.activeElement);
        originalOpenBrandingModal.call(this);
        focusDialog('branding-modal');
    };

    const originalCloseBrandingModal = window.closeBrandingModal;
    window.closeBrandingModal = function () {
        originalCloseBrandingModal.call(this);
        restoreFocus('branding-modal');
    };

    const originalOpenImageModal = window.openImageModal;
    window.openImageModal = function (src) {
        rememberTrigger('image-modal', document.activeElement);
        originalOpenImageModal.call(this, src);
        focusDialog('image-modal');
    };

    const originalCloseImageModal = window.closeImageModal;
    window.closeImageModal = function () {
        originalCloseImageModal.call(this);
        restoreFocus('image-modal');
    };

    const originalShowModal = showModal;
    showModal = function (message, isConfirm = false, onConfirm = null) {
        rememberTrigger('custom-modal', document.activeElement);
        originalShowModal.call(this, message, isConfirm, onConfirm);
        focusDialog('custom-modal');
    };

    function applyDialogAccessibility() {
        setupDialogAccessibility('custom-modal', '#modal-message', '#modal-message');
        setupDialogAccessibility('image-modal', '#image-modal-content', '#image-modal-content');
        setupDialogAccessibility('theme-modal', '.theme-modal-header span', '.theme-list-title');
        setupDialogAccessibility('branding-modal', '.theme-modal-header span', '.branding-field');
        setupDialogAccessibility('project-modal', '.theme-modal-header span', '#project-modal-current-meta');
    }

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        applyDialogAccessibility();
        makeTocItemsKeyboardNavigable();
        addButtonLabels();
    };

    window.addEventListener('load', applyDialogAccessibility);
    applyDialogAccessibility();
    makeTocItemsKeyboardNavigable();
    addButtonLabels();
})();

// --- Extracted from src/html5_phase9.js ---

(function () {
    'use strict';

    let phase9Observer = null;

    function cloneTemplate(templateId) {
        const template = document.getElementById(templateId);
        if (!template) return null;
        return document.importNode(template.content.firstElementChild, true);
    }

    function scrollToSlide(index) {
        const target = document.getElementById(`preview-slide-${index}`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function buildTemplateToc() {
        const nav = document.getElementById('toc-navigator');
        if (!nav) return;

        nav.innerHTML = '<div class="toc-sidebar-title"><i class="fa-solid fa-list"></i> Navigator</div>';

        if (!slidesData.length) {
            const empty = document.createElement('div');
            empty.className = 'toc-sidebar-empty';
            empty.innerHTML = '<i class="fa-solid fa-file-circle-plus toc-sidebar-empty-icon"></i>슬라이드를 추가하면<br>목차가 여기에 표시됩니다.';
            nav.appendChild(empty);
            return;
        }

        let prevChapter = null;
        let prevMiddleTitle = null;
        const firstTitleByKey = {};

        slidesData.forEach((slide, index) => {
            const chapter = slide.chapter || 'Untitled Chapter';
            const middleTitle = slide.middleTitle || '';
            const title = slide.title || `Slide ${index + 1}`;

            if (chapter !== prevChapter) {
                const chapterEl = cloneTemplate('phase9-toc-chapter-template');
                chapterEl.textContent = chapter;
                chapterEl.classList.add('phase9-template-item');
                nav.appendChild(chapterEl);
                prevChapter = chapter;
                prevMiddleTitle = null;
            }

            if (middleTitle && middleTitle !== prevMiddleTitle) {
                const middleEl = cloneTemplate('phase9-toc-middle-template');
                middleEl.textContent = middleTitle;
                middleEl.classList.add('phase9-template-item');
                middleEl.addEventListener('click', () => scrollToSlide(index));
                middleEl.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        scrollToSlide(index);
                    }
                });
                nav.appendChild(middleEl);
                prevMiddleTitle = middleTitle;
            }

            const key = `${chapter}||${middleTitle}||${title}`;
            if (!firstTitleByKey[key]) {
                const titleEl = cloneTemplate('phase9-toc-title-template');
                titleEl.id = `toc-item-${index}`;
                titleEl.textContent = title;
                titleEl.dataset.slide = String(index);
                titleEl.dataset.key = key;
                titleEl.classList.add('phase9-template-item');
                titleEl.addEventListener('click', () => scrollToSlide(index));
                titleEl.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        scrollToSlide(index);
                    }
                });
                nav.appendChild(titleEl);
                firstTitleByKey[key] = titleEl;
            }
        });

        bindActiveSlideObserver(firstTitleByKey);
    }

    function bindActiveSlideObserver(firstTitleByKey) {
        if (phase9Observer) {
            phase9Observer.disconnect();
        }

        const slideEls = Array.from(document.querySelectorAll('.slide-preview[id^="preview-slide-"]'));
        const syncActiveToc = () => {
            const focusBandTop = window.innerHeight * 0.24;
            let bestSlide = null;
            let bestVisibleHeight = -1;
            let bestScore = Number.POSITIVE_INFINITY;

            slideEls.forEach((slideEl) => {
                const rect = slideEl.getBoundingClientRect();
                if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
                    return;
                }

                const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
                const slideMidpoint = rect.top + rect.height / 2;
                const score = Math.abs(slideMidpoint - focusBandTop);
                if (visibleHeight > bestVisibleHeight || (visibleHeight === bestVisibleHeight && score < bestScore)) {
                    bestVisibleHeight = visibleHeight;
                    bestScore = score;
                    bestSlide = slideEl;
                }
            });

            document.querySelectorAll('.toc-nav-title.phase9-template-item').forEach((item) => {
                item.classList.remove('active');
                item.dataset.active = 'false';
            });

            if (!bestSlide) {
                return;
            }

            const slideIndex = bestSlide.id.replace('preview-slide-', '');
            const slide = slidesData[Number(slideIndex)];
            if (!slide) {
                return;
            }

            const key = `${slide.chapter || 'Untitled Chapter'}||${slide.middleTitle || ''}||${slide.title || `Slide ${Number(slideIndex) + 1}`}`;
            const activeEl = firstTitleByKey[key];
            if (!activeEl) {
                return;
            }

            activeEl.classList.add('active');
            activeEl.dataset.active = 'true';
        };

        phase9Observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                syncActiveToc();
            }
        }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

        slideEls.forEach((slideEl) => phase9Observer.observe(slideEl));
        syncActiveToc();
    }

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        buildTemplateToc();
    };

    buildTemplateToc();
})();
