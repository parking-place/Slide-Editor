(function () {
    'use strict';

    const PHASE3_IMAGE_OBSERVERS = new WeakMap();
    const PHASE3_SLIDE_OBSERVER = createSlideObserver();
    const PHASE3_PLACEHOLDER_SRC = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#111827"/></svg>'
    );

    function createSlideObserver() {
        if (!('IntersectionObserver' in window)) {
            return null;
        }

        return new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle('is-near-viewport', entry.isIntersecting);
                entry.target.classList.toggle('is-virtualized', !entry.isIntersecting);
            });
        }, {
            rootMargin: '160% 0px 160% 0px',
            threshold: 0.01
        });
    }

    function applyPreviewSlideVirtualization() {
        document.querySelectorAll('.slide-preview').forEach((slideEl) => {
            const isContentSlide = slideEl.id && slideEl.id.startsWith('preview-slide-');
            const isTocSlide = !slideEl.id && slideEl.querySelector('.toc-container');

            if (isContentSlide) {
                slideEl.classList.add('phase3-virtual-slide');
                slideEl.classList.add('is-near-viewport');
                if (PHASE3_SLIDE_OBSERVER) {
                    PHASE3_SLIDE_OBSERVER.observe(slideEl);
                }
            } else if (isTocSlide) {
                slideEl.classList.add('phase3-virtual-toc');
            }
        });
    }

    function observeLazyImage(img) {
        if (!('IntersectionObserver' in window)) {
            restoreImage(img);
            return;
        }

        if (PHASE3_IMAGE_OBSERVERS.has(img)) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    restoreImage(img);
                } else if (!img.closest('.is-near-viewport')) {
                    suspendImage(img);
                }
            });
        }, {
            rootMargin: '180% 0px 180% 0px',
            threshold: 0.01
        });

        observer.observe(img);
        PHASE3_IMAGE_OBSERVERS.set(img, observer);
    }

    function restoreImage(img) {
        if (!img || !img.dataset.phase3Src) return;
        if (img.getAttribute('src') !== img.dataset.phase3Src) {
            img.setAttribute('src', img.dataset.phase3Src);
        }
        img.dataset.phase3Pending = 'false';
    }

    function suspendImage(img) {
        if (!img || !img.dataset.phase3Src) return;
        if (img.getAttribute('src') === PHASE3_PLACEHOLDER_SRC) return;
        img.setAttribute('src', PHASE3_PLACEHOLDER_SRC);
        img.dataset.phase3Pending = 'true';
    }

    function applyLazyImages() {
        document.querySelectorAll('.slide-preview .box.image-box img').forEach((img, index) => {
            const src = img.getAttribute('src');
            if (!src || src.startsWith('data:image/svg+xml')) return;

            img.classList.add('phase3-lazy-image');
            img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
            img.setAttribute('fetchpriority', index < 2 ? 'high' : 'low');

            if (!img.dataset.phase3Src) {
                img.dataset.phase3Src = src;
            }

            if (index >= 2) {
                suspendImage(img);
            } else {
                restoreImage(img);
            }

            observeLazyImage(img);
        });
    }

    function applyPhase3Enhancements() {
        applyPreviewSlideVirtualization();
        applyLazyImages();
    }

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        applyPhase3Enhancements();
    };
})();
