(function () {
    'use strict';

    function openDialog(modal) {
        if (!modal) return;
        if (typeof modal.showModal === 'function') {
            if (!modal.open) {
                modal.showModal();
            }
            return;
        }
        modal.style.display = 'flex';
    }

    function closeDialog(modal) {
        if (!modal) return;
        if (typeof modal.close === 'function') {
            if (modal.open) {
                modal.close();
            }
            return;
        }
        modal.style.display = 'none';
    }

    function setupDialogDismiss(modalId, closeHandler) {
        const modal = document.getElementById(modalId);
        if (!modal || modal.dataset.phase4Bound === 'true') return;

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeHandler();
            }
        });
        modal.dataset.phase4Bound = 'true';
    }

    function updateDynamicFormAttributes() {
        const selectorMap = [
            ['#input-chapter', { maxlength: '120', autocomplete: 'off' }],
            ['#input-middle-title', { maxlength: '160', autocomplete: 'off' }],
            ['#input-title', { maxlength: '160', required: 'required', autocomplete: 'off' }],
            ['#input-image-caption', { maxlength: '160', autocomplete: 'off' }],
            ['#edit-chapter', { maxlength: '120', autocomplete: 'off' }],
            ['#edit-middle-title', { maxlength: '160', autocomplete: 'off' }],
            ['#edit-title', { maxlength: '160', required: 'required', autocomplete: 'off' }],
            ['#edit-image-caption', { maxlength: '160', autocomplete: 'off' }]
        ];

        selectorMap.forEach(([selector, attrs]) => {
            const field = document.querySelector(selector);
            if (!field) return;
            Object.entries(attrs).forEach(([key, value]) => field.setAttribute(key, value));
        });

        document.querySelectorAll('.file-upload-status').forEach((statusEl) => {
            statusEl.setAttribute('role', 'status');
            statusEl.setAttribute('aria-live', 'polite');
        });

        const statusBar = document.getElementById('status-text');
        if (statusBar) {
            statusBar.setAttribute('role', 'status');
            statusBar.setAttribute('aria-live', 'polite');
        }
    }

    function convertImageBoxToFigure(imageBox) {
        if (!imageBox || imageBox.tagName === 'FIGURE') return imageBox;

        const figure = document.createElement('figure');
        figure.className = imageBox.className;
        figure.style.cssText = imageBox.style.cssText;
        Array.from(imageBox.attributes).forEach((attr) => {
            if (attr.name === 'class' || attr.name === 'style') return;
            figure.setAttribute(attr.name, attr.value);
        });

        while (imageBox.firstChild) {
            figure.appendChild(imageBox.firstChild);
        }

        Array.from(figure.children).forEach((child) => {
            const isProcessingState = child.classList && child.classList.contains('image-processing-state');
            const isExistingCaption = child.classList && child.classList.contains('image-processing-caption');
            const isCaptionCandidate = child.tagName === 'DIV' && !isProcessingState && (isExistingCaption || child.textContent.trim().length > 0);

            if (isCaptionCandidate) {
                const caption = document.createElement('figcaption');
                caption.className = child.className || 'image-processing-caption';
                caption.innerHTML = child.innerHTML;
                child.replaceWith(caption);
            }
        });

        imageBox.replaceWith(figure);
        return figure;
    }

    function applySemanticPreview() {
        const previewArea = document.getElementById('preview-area');
        if (previewArea) {
            previewArea.setAttribute('role', 'list');
        }

        document.querySelectorAll('.slide-preview[id^="preview-slide-"]').forEach((slideEl, index) => {
            slideEl.setAttribute('role', 'article');
            slideEl.setAttribute('aria-posinset', String(index + 1));
            slideEl.setAttribute('aria-setsize', String(slidesData.length));

            const titleEl = slideEl.querySelector('.preview-title');
            if (titleEl) {
                if (!titleEl.id) {
                    titleEl.id = `phase4-preview-title-${index}`;
                }
                slideEl.setAttribute('aria-labelledby', titleEl.id);
            }

            const imageBox = slideEl.querySelector('.image-box');
            if (imageBox) {
                convertImageBoxToFigure(imageBox);
            }
        });
    }

    setupDialogDismiss('custom-modal', () => closeDialog(document.getElementById('custom-modal')));
    setupDialogDismiss('image-modal', () => window.closeImageModal());
    setupDialogDismiss('theme-modal', () => window.closeThemeModal());
    setupDialogDismiss('branding-modal', () => window.closeBrandingModal());
    setupDialogDismiss('project-modal', () => window.closeProjectModal());

    showModal = function (message, isConfirm = false, onConfirm = null) {
        const modal = document.getElementById('custom-modal');
        const msgEl = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-btn-confirm');
        const btnCancel = document.getElementById('modal-btn-cancel');

        msgEl.innerText = message;

        if (isConfirm) {
            btnCancel.style.display = 'inline-block';
            btnConfirm.innerText = '삭제';
            btnConfirm.onclick = function () {
                if (onConfirm) onConfirm();
                closeDialog(modal);
            };
        } else {
            btnCancel.style.display = 'none';
            btnConfirm.innerText = '확인';
            btnConfirm.onclick = function () {
                closeDialog(modal);
            };
        }

        btnCancel.onclick = function () {
            closeDialog(modal);
        };

        openDialog(modal);
    };

    window.openImageModal = function (src) {
        const modal = document.getElementById('image-modal');
        const img = document.getElementById('image-modal-content');
        img.src = src;
        openDialog(modal);
    };

    window.closeImageModal = function () {
        closeDialog(document.getElementById('image-modal'));
    };

    window.openThemeModal = function () {
        const modal = document.getElementById('theme-modal');
        if (!modal) return;
        renderThemeModal();
        openDialog(modal);
    };

    window.closeThemeModal = function () {
        closeDialog(document.getElementById('theme-modal'));
    };

    window.openBrandingModal = function () {
        const modal = document.getElementById('branding-modal');
        if (!modal) return;
        syncBrandingUI();
        openDialog(modal);
    };

    window.closeBrandingModal = function () {
        closeDialog(document.getElementById('branding-modal'));
    };

    window.openProjectModal = async function (mode = 'open') {
        const modal = document.getElementById('project-modal');
        if (!modal) return;

        projectModalState.mode = mode;
        projectModalState.isSubmitting = false;

        try {
            await refreshProjectList();
            projectModalState.selectedProjectId = currentProject?.id || availableProjects[0]?.id || null;
            projectModalState.nameDraft = mode === 'rename'
                ? (getSelectedProjectFromModal()?.name || '')
                : getProjectModalDefaultName(mode);
            renderProjectModal();
            openDialog(modal);
        } catch (err) {
            showModal('Failed to load project list.\n' + err.message);
        }
    };

    window.closeProjectModal = function () {
        closeDialog(document.getElementById('project-modal'));
    };

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        updateDynamicFormAttributes();
        applySemanticPreview();
    };

    updateDynamicFormAttributes();
})();
