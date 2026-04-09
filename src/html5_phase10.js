(function () {
    'use strict';

    function buildOutline(slides) {
        return (slides || []).map((slide, index) => ({
            index,
            chapter: slide.chapter || 'Untitled Chapter',
            middleTitle: slide.middleTitle || '',
            title: slide.title || `Slide ${index + 1}`
        }));
    }

    function applyEditorOutlineMetadata() {
        const outline = buildOutline(slidesData);

        outline.forEach((entry) => {
            const slideEl = document.getElementById(`preview-slide-${entry.index}`);
            if (!slideEl) return;
            slideEl.dataset.slideIndex = String(entry.index);
            slideEl.dataset.outlineChapter = entry.chapter;
            slideEl.dataset.outlineMiddle = entry.middleTitle;
            slideEl.dataset.outlineTitle = entry.title;

            const figure = slideEl.querySelector('figure, .image-box');
            if (figure) {
                figure.dataset.mediaRole = 'slide-figure';
            }
        });

        document.querySelectorAll('.toc-nav-title.phase9-template-item').forEach((item) => {
            const slideIndex = Number(item.dataset.slide);
            const entry = outline[slideIndex];
            if (!entry) return;
            item.dataset.outlineChapter = entry.chapter;
            item.dataset.outlineMiddle = entry.middleTitle;
            item.dataset.outlineTitle = entry.title;
        });
    }

    function synchronizeGuideHtml(html, sourceSlides) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const outline = buildOutline(sourceSlides);

        outline.forEach((entry) => {
            const article = doc.getElementById(`guide-slide-${entry.index}`);
            if (article) {
                article.dataset.slideIndex = String(entry.index);
                article.dataset.outlineChapter = entry.chapter;
                article.dataset.outlineMiddle = entry.middleTitle;
                article.dataset.outlineTitle = entry.title;
            }

            const tocLinks = doc.querySelectorAll(`a[href="#guide-slide-${entry.index}"]`);
            tocLinks.forEach((link) => {
                link.dataset.slideIndex = String(entry.index);
                link.dataset.outlineChapter = entry.chapter;
                link.dataset.outlineMiddle = entry.middleTitle;
                link.dataset.outlineTitle = entry.title;
            });
        });

        return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    }

    async function downloadHtml(htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'SlideEditor_Web_Guide.html';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    const originalViewWebGuide = window.viewWebGuide;
    window.viewWebGuide = async function () {
        if (slidesData.length === 0) {
            return originalViewWebGuide.call(this);
        }

        const button = document.getElementById('dl-html-view-btn');
        if (button) {
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중..';
            button.disabled = true;
        }

        try {
            const html = window.__phase5GenerateGuideHtml(slidesData);
            const syncedHtml = synchronizeGuideHtml(html, slidesData);
            const response = await fetch('/api/saveHtml', {
                method: 'POST',
                headers: { 'Content-Type': 'text/html' },
                body: syncedHtml
            });

            if (!response.ok) {
                throw new Error('Server save failed');
            }

            window.open('/exports/SlideEditor_Web_Guide.html?t=' + Date.now(), '_blank');
        } catch (error) {
            console.warn('[Phase10] viewWebGuide fallback', error);
            const portableSlides = await buildPortableSlides(slidesData);
            const html = window.__phase5GenerateGuideHtml(portableSlides);
            await downloadHtml(synchronizeGuideHtml(html, portableSlides));
        } finally {
            if (button) {
                button.innerHTML = '<i class="fa-solid fa-book-open"></i> Guide';
                button.disabled = false;
            }
        }
    };

    const originalExportToHTML = window.exportToHTML;
    window.exportToHTML = async function () {
        if (slidesData.length === 0) {
            return originalExportToHTML.call(this);
        }

        const button = document.getElementById('dl-html-btn');
        if (button) {
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중..';
            button.disabled = true;
        }

        try {
            const portableSlides = await buildPortableSlides(slidesData);
            const html = window.__phase5GenerateGuideHtml(portableSlides);
            await downloadHtml(synchronizeGuideHtml(html, portableSlides));
        } catch (error) {
            console.error('[Phase10] exportToHTML failed', error);
            showModal('HTML 다운로드용 이미지를 준비하는 중 오류가 발생했습니다.\n' + error.message);
        } finally {
            if (button) {
                button.innerHTML = '<i class="fa-solid fa-file-code"></i> HTML';
                button.disabled = false;
            }
        }
    };

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        applyEditorOutlineMetadata();
    };

    window.__phase10BuildOutline = buildOutline;
    window.__phase10SynchronizeGuideHtml = synchronizeGuideHtml;

    applyEditorOutlineMetadata();
})();
