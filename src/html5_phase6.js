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
            ['#branding-project-name', { minlength: '1', maxlength: '120' }],
            ['#branding-guide-subtitle', { maxlength: '160' }],
            ['#branding-footer-copy', { maxlength: '80' }],
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

        if (textArea) {
            form.appendChild(createFieldset('본문', [textArea]));
        }

        if (mediaWrapper || ratioWrapper || deleteBlock) {
            if (deleteBlock) {
                deleteBlock.classList.add('phase6-media-delete');
            }
            form.appendChild(createFieldset('미디어', [mediaWrapper, ratioWrapper, deleteBlock]));
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
