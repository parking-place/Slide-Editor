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
