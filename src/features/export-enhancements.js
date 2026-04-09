// Auto-extracted modular feature: Export

// --- Extracted from src/webp_phase5.js ---

(function () {
    'use strict';

    function cloneSlidesForExport(slides) {
        return Array.isArray(slides)
            ? slides.map((slide) => Object.assign({}, slide, slide?.imageAsset ? { imageAsset: Object.assign({}, slide.imageAsset) } : {}))
            : [];
    }

    function resolveSlideImageSource(slide) {
        if (!slide) return null;
        const asset = slide.imageAsset || null;

        if (asset) {
            if (asset.status === 'ready') {
                return asset.fileUrl || slide.image || asset.originalUrl || null;
            }

            if (asset.status === 'failed') {
                return asset.originalUrl || slide.image || asset.fileUrl || null;
            }

            if (asset.status === 'queued' || asset.status === 'converting') {
                return asset.originalUrl || slide.image || asset.fileUrl || null;
            }
        }

        return slide.image || null;
    }

    async function toPortableImageSource(imageValue) {
        if (!imageValue) return null;
        if (isInlineImageData(imageValue)) return imageValue;

        const normalized = getSlideImageSrc(imageValue);
        if (!normalized) return null;

        if (!isStoredImagePath(normalized) && !/^\/api\/projects\/[^/]+\/images\/[^/]+\/(?:file|original)$/.test(normalized.replace(/\\/g, '/'))) {
            return normalized;
        }

        return fetchImageAsDataUrl(normalized);
    }

    async function buildExportSlides(slides, portable) {
        const exportedSlides = cloneSlidesForExport(slides);

        await Promise.all(exportedSlides.map(async (slide) => {
            const resolvedSource = resolveSlideImageSource(slide);
            if (!resolvedSource) {
                slide.image = null;
                return;
            }

            slide.image = portable ? await toPortableImageSource(resolvedSource) : getSlideImageSrc(resolvedSource);
        }));

        return exportedSlides;
    }

    buildPortableSlides = async function (slides) {
        return buildExportSlides(slides, true);
    };

    buildPptxSlides = async function (slides) {
        return buildExportSlides(slides, true);
    };

    function buildGuideNavigatorModel(sourceSlides) {
        let html = '';
        let previousChapter = null;
        let previousMiddleTitle = null;
        const titleKeyToTocId = {};
        const slideToTocId = {};

        sourceSlides.forEach((slide, index) => {
            const chapter = slide.chapter || 'Untitled Chapter';
            const middleTitle = slide.middleTitle || '';
            const title = slide.title || `Slide ${index + 1}`;

            if (chapter !== previousChapter) {
                html += `<div class="toc-nav-chapter" title="${escapeHtml(chapter)}">${escapeHtml(chapter)}</div>`;
                previousChapter = chapter;
                previousMiddleTitle = null;
            }

            if (middleTitle && middleTitle !== previousMiddleTitle) {
                html += `<div class="toc-nav-middle" data-target="guide-slide-${index}" tabindex="0" role="button" title="${escapeHtml(middleTitle)}">${escapeHtml(middleTitle)}</div>`;
                previousMiddleTitle = middleTitle;
            }

            const titleKey = `${chapter}||${middleTitle}||${title}`;
            if (titleKeyToTocId[titleKey]) {
                slideToTocId[index] = titleKeyToTocId[titleKey];
                return;
            }

            const tocId = `guide-toc-item-${index}`;
            titleKeyToTocId[titleKey] = tocId;
            slideToTocId[index] = tocId;
            html += `<div class="toc-nav-title" id="${tocId}" data-slide="${index}" data-target="guide-slide-${index}" tabindex="0" role="button" title="${escapeHtml(title)}">${escapeHtml(title)}</div>`;
        });

        return { html, slideToTocId };
    }

    function generateGuideHtml(sourceSlides = slidesData) {
        const themeGuide = (activeTheme && activeTheme.webGuide) || {};
        const branding = projectSettings.branding || {};
        const accentColor = themeGuide.accentColor || '#01a982';
        const headerBg = themeGuide.headerBg || accentColor;
        const darkAccent = themeGuide.darkAccent || '#00e676';
        const footerCopy = branding.footerCopy || branding.projectName || 'My Guide';
        const navigatorModel = buildGuideNavigatorModel(sourceSlides);
        const bodyClass = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';

        const cardsHtml = sourceSlides.map((slide, index) => {
            const imageSrc = slide.image ? getSlideImageSrc(slide.image) : resolveSlideImageSource(slide);
            const parsedMarkdownText = marked.parse(slide.text || '');
            const hasText = Boolean(slide.text && slide.text.trim());
            const hasImage = Boolean(imageSrc);
            const textRatio = slide.textRatio || 50;
            const textFlex = hasText && hasImage ? textRatio : 100;
            const imageFlex = hasText && hasImage ? (100 - textRatio) : 100;
            const middleTitleHtml = slide.middleTitle ? `<p class="guide-middle-title">${escapeHtml(slide.middleTitle)}</p>` : '';
            const imageAlt = escapeHtml(slide.title || `Slide ${index + 1}`);
            const imageHtml = hasImage ? `
                <figure class="guide-figure" style="flex:${imageFlex};">
                    <picture>
                        <img
                            class="guide-image-zoomable"
                            src="${imageSrc}"
                            alt="${imageAlt}"
                            loading="lazy"
                            decoding="async"
                            tabindex="0"
                            role="button"
                            aria-label="${imageAlt} 이미지 확대 보기"
                            data-guide-zoomable="true">
                    </picture>
                    ${slide.imageCaption ? `<figcaption>${escapeHtml(slide.imageCaption)}</figcaption>` : ''}
                </figure>
            ` : '';

            const textHtml = hasText ? `
                <section class="guide-text" style="flex:${textFlex};">
                    <div class="markdown-body">${parsedMarkdownText}</div>
                </section>
            ` : '';

            return `
                <article class="guide-card" id="guide-slide-${index}" data-guide-toc-id="${navigatorModel.slideToTocId[index] || ''}">
                    <header class="guide-card-header">
                        <p class="guide-chapter">${escapeHtml(slide.chapter || 'Untitled Chapter')}</p>
                        ${middleTitleHtml}
                        <h2 class="guide-title">${escapeHtml(slide.title || `Slide ${index + 1}`)}</h2>
                    </header>
                    <section class="guide-card-body">
                        ${textHtml}
                        ${imageHtml}
                    </section>
                </article>
            `;
        }).join('');

        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(branding.projectName || 'Slide Editor Guide')}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_three@1.5/D2Coding.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/atom-one-dark.min.css">
    <style>
        :root { color-scheme: ${bodyClass === 'light-mode' ? 'light' : 'dark'}; }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; font-family: 'Pretendard', 'Segoe UI', sans-serif; background: ${bodyClass === 'light-mode' ? '#f3f4f6' : '#010409'}; color: ${bodyClass === 'light-mode' ? '#111827' : '#f8fafc'}; }
        .guide-header { background: ${headerBg}; color: #fff; padding: 48px 24px; text-align: center; }
        .guide-header h1 { margin: 0 0 8px; font-size: 34px; }
        .guide-header p { margin: 0; font-size: 18px; opacity: 0.92; }
        .guide-layout { max-width: 1400px; margin: 0 auto; display: flex; gap: 0; padding: 24px 20px; align-items: flex-start; }
        .guide-aside { width: 240px; flex-shrink: 0; position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow-y: auto; padding: 20px 16px; border-right: 1px solid rgba(148,163,184,0.2); }
        .guide-aside::-webkit-scrollbar { width: 4px; }
        .guide-aside::-webkit-scrollbar-track { background: transparent; }
        .guide-aside::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.4); border-radius: 4px; }
        .guide-aside::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.7); }
        .guide-aside .toc-sidebar-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${bodyClass === 'light-mode' ? '#64748b' : '#8b949e'}; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid rgba(148,163,184,0.2); }
        .guide-aside .toc-nav-chapter { font-size: 12px; font-weight: 700; color: ${accentColor}; margin-top: 14px; margin-bottom: 4px; padding: 0 6px; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .guide-aside .toc-nav-chapter:first-child { margin-top: 0; }
        .guide-aside .toc-nav-middle { font-size: 12px; font-weight: 600; color: ${bodyClass === 'light-mode' ? '#64748b' : '#8b949e'}; padding: 3px 6px 3px 14px; margin-bottom: 2px; border-radius: 5px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .guide-aside .toc-nav-middle:hover,
        .guide-aside .toc-nav-middle:focus-visible { background: ${accentColor}1A; color: ${accentColor}; padding-left: 18px; outline: none; }
        .guide-aside .toc-nav-title { font-size: 12px; color: ${bodyClass === 'light-mode' ? '#64748b' : '#8b949e'}; padding: 4px 6px 4px 24px; border-radius: 5px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease, border-left 0.15s ease; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 2px solid transparent; }
        .guide-aside .toc-nav-title:hover,
        .guide-aside .toc-nav-title:focus-visible { background: ${bodyClass === 'light-mode' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}; color: ${bodyClass === 'light-mode' ? '#111827' : '#f8fafc'}; padding-left: 27px; outline: none; }
        .guide-aside .toc-nav-title.active { color: ${accentColor}; background: ${accentColor}1A; border-left: 2px solid ${accentColor}; font-weight: 600; }
        .guide-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 24px; }
        .guide-card { background: ${bodyClass === 'light-mode' ? '#ffffff' : '#0f172a'}; border: 1px solid rgba(148,163,184,0.2); border-radius: 18px; overflow: hidden; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); }
        .guide-card-header { padding: 24px 28px 18px; border-left: 6px solid ${accentColor}; background: ${bodyClass === 'light-mode' ? '#f8fafc' : '#111827'}; }
        .guide-chapter { margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${accentColor}; }
        .guide-middle-title { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: ${bodyClass === 'light-mode' ? '#475569' : '#cbd5e1'}; }
        .guide-title { margin: 0; font-size: 28px; line-height: 1.25; color: inherit; }
        .guide-card-body { display: flex; gap: 24px; padding: 28px; flex-wrap: wrap; }
        .guide-text { min-width: 280px; }
        .guide-figure { min-width: 280px; margin: 0; display: flex; flex-direction: column; align-items: center; }
        .guide-figure img { max-width: 100%; border-radius: 14px; border: 1px solid rgba(148,163,184,0.2); box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16); }
        .guide-figure img[data-guide-zoomable="true"] { cursor: zoom-in; transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .guide-figure img[data-guide-zoomable="true"]:hover,
        .guide-figure img[data-guide-zoomable="true"]:focus-visible { transform: scale(1.01); box-shadow: 0 14px 34px rgba(15, 23, 42, 0.22); outline: none; }
        .guide-figure figcaption { margin-top: 10px; font-size: 13px; color: ${bodyClass === 'light-mode' ? '#475569' : '#cbd5e1'}; text-align: center; }
        .markdown-body p { margin: 0 0 0.8em; white-space: pre-wrap; word-break: break-word; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { color: ${accentColor}; margin: 1em 0 0.5em; }
        .markdown-body h1:first-child, .markdown-body h2:first-child, .markdown-body h3:first-child { margin-top: 0; }
        .markdown-body ul, .markdown-body ol { padding-left: 20px; margin: 0 0 1em; }
        .markdown-body code { background: rgba(1, 169, 130, 0.14); color: ${darkAccent}; padding: 2px 6px; border-radius: 6px; font-family: 'D2Coding', monospace; }
        .markdown-body pre { margin: 0 0 1em; overflow-x: auto; background: #0f172a; border: 1px solid rgba(148,163,184,0.2); border-left: 4px solid ${accentColor}; border-radius: 12px; padding: 16px; }
        .markdown-body pre code { background: transparent; color: inherit; padding: 0; }
        .guide-footer { max-width: 1440px; margin: 0 auto 32px; padding: 0 24px; color: ${bodyClass === 'light-mode' ? '#475569' : '#cbd5e1'}; font-size: 13px; }
        .guide-lightbox[hidden] { display: none; }
        .guide-lightbox { position: fixed; inset: 0; z-index: 10000; background: rgba(2, 6, 23, 0.82); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(8px); }
        .guide-lightbox-figure { margin: 0; max-width: min(92vw, 1440px); max-height: 92vh; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .guide-lightbox-image { max-width: 100%; max-height: calc(92vh - 64px); object-fit: contain; border-radius: 18px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45); background: rgba(15, 23, 42, 0.4); }
        .guide-lightbox-caption { font-size: 14px; text-align: center; color: #e2e8f0; }
        .guide-lightbox-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; border: none; border-radius: 999px; background: rgba(255, 255, 255, 0.14); color: #fff; font-size: 28px; line-height: 1; cursor: pointer; }
        .guide-lightbox-close:hover,
        .guide-lightbox-close:focus-visible { background: rgba(255, 255, 255, 0.24); outline: none; }
        @media (max-width: 1100px) {
            .guide-layout { flex-direction: column; }
            .guide-aside { width: 100%; position: static; max-height: none; border-right: none; border-bottom: 1px solid rgba(148,163,184,0.2); margin-bottom: 16px; }
        }
    </style>
</head>
<body>
    <header class="guide-header">
        <h1>${escapeHtml(branding.projectName || 'My Guide')}</h1>
        <p>${escapeHtml(branding.guideSubtitle || '')}</p>
    </header>
    <div class="guide-layout">
        <aside class="guide-aside" aria-label="문서 목차">
            <div class="toc-sidebar-title">Navigator</div>
            ${navigatorModel.html}
        </aside>
        <main class="guide-main">
            ${cardsHtml}
        </main>
    </div>
    <footer class="guide-footer">
        ${escapeHtml(footerCopy)} · Generated by Slide Editor
    </footer>
    <div id="guide-lightbox" class="guide-lightbox" hidden aria-hidden="true" aria-label="확대 이미지 보기">
        <button type="button" id="guide-lightbox-close" class="guide-lightbox-close" aria-label="확대 이미지 닫기">&times;</button>
        <figure class="guide-lightbox-figure">
            <img id="guide-lightbox-image" class="guide-lightbox-image" alt="">
            <figcaption id="guide-lightbox-caption" class="guide-lightbox-caption"></figcaption>
        </figure>
    </div>
    <script>
        (function () {
            var tocItems = Array.prototype.slice.call(document.querySelectorAll('.guide-aside .toc-nav-title'));
            var tocMiddleItems = Array.prototype.slice.call(document.querySelectorAll('.guide-aside .toc-nav-middle'));
            var guideCards = Array.prototype.slice.call(document.querySelectorAll('.guide-card[id^="guide-slide-"]'));
            var lightbox = document.getElementById('guide-lightbox');
            var lightboxImage = document.getElementById('guide-lightbox-image');
            var lightboxCaption = document.getElementById('guide-lightbox-caption');
            var lightboxClose = document.getElementById('guide-lightbox-close');

            function scrollToTarget(targetId) {
                var target = targetId ? document.getElementById(targetId) : null;
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }

            function setActiveToc(tocId) {
                tocItems.forEach(function (item) {
                    var isActive = item.id === tocId;
                    item.classList.toggle('active', isActive);
                    item.dataset.active = isActive ? 'true' : 'false';
                    if (isActive) {
                        item.setAttribute('aria-current', 'location');
                        item.scrollIntoView({ block: 'nearest' });
                    } else {
                        item.removeAttribute('aria-current');
                    }
                });
            }

            function openLightbox(imageElement) {
                if (!lightbox || !lightboxImage || !imageElement) return;
                lightboxImage.src = imageElement.getAttribute('src') || '';
                lightboxImage.alt = imageElement.getAttribute('alt') || '확대 이미지';
                lightboxCaption.textContent = imageElement.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || imageElement.getAttribute('alt') || '';
                lightbox.hidden = false;
                lightbox.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                if (lightboxClose) lightboxClose.focus();
            }

            function closeLightbox() {
                if (!lightbox || lightbox.hidden) return;
                lightbox.hidden = true;
                lightbox.setAttribute('aria-hidden', 'true');
                lightboxImage.src = '';
                document.body.style.overflow = '';
            }

            tocItems.forEach(function (item) {
                function handleNavigate() {
                    var targetId = item.dataset.target || '';
                    if (targetId) {
                        scrollToTarget(targetId);
                        setActiveToc(item.id);
                    }
                }

                item.addEventListener('click', handleNavigate);
                item.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleNavigate();
                    }
                });
            });

            tocMiddleItems.forEach(function (item) {
                function handleNavigate() {
                    var targetId = item.dataset.target || '';
                    if (targetId) {
                        scrollToTarget(targetId);
                    }
                }

                item.addEventListener('click', handleNavigate);
                item.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleNavigate();
                    }
                });
            });

            if (guideCards.length && tocItems.length) {
                setActiveToc(guideCards[0].dataset.guideTocId || tocItems[0].id);
                if ('IntersectionObserver' in window) {
                    var observer = new IntersectionObserver(function (entries) {
                        var visibleCard = entries
                            .filter(function (entry) { return entry.isIntersecting; })
                            .sort(function (left, right) { return right.intersectionRatio - left.intersectionRatio; })[0];
                        if (!visibleCard) return;
                        setActiveToc(visibleCard.target.dataset.guideTocId || '');
                    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] });

                    guideCards.forEach(function (card) { observer.observe(card); });
                }
            }

            Array.prototype.slice.call(document.querySelectorAll('.guide-image-zoomable')).forEach(function (imageElement) {
                imageElement.addEventListener('click', function () { openLightbox(imageElement); });
                imageElement.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openLightbox(imageElement);
                    }
                });
            });

            if (lightbox) {
                lightbox.addEventListener('click', function (event) {
                    if (event.target === lightbox) closeLightbox();
                });
            }
            if (lightboxClose) {
                lightboxClose.addEventListener('click', closeLightbox);
            }
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') closeLightbox();
            });
        })();
    <\/script>
</body>
</html>`;
    }

    async function downloadGuideHtml() {
        const portableSlides = await buildPortableSlides(slidesData);
        const htmlContent = generateGuideHtml(portableSlides);
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

    window.viewWebGuide = async function () {
        if (slidesData.length === 0) {
            showModal('배포할 슬라이드 내용을 하나 이상 작성해주세요.');
            return;
        }

        const button = document.getElementById('dl-html-view-btn');
        if (button) {
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중..';
            button.disabled = true;
        }

        try {
            const htmlContent = generateGuideHtml(slidesData);
            const response = await fetch('/api/saveHtml', {
                method: 'POST',
                headers: { 'Content-Type': 'text/html' },
                body: htmlContent
            });

            if (!response.ok) {
                throw new Error('Server save failed');
            }

            window.open('/exports/SlideEditor_Web_Guide.html?t=' + Date.now(), '_blank');
        } catch (error) {
            console.warn('[Phase5] viewWebGuide fallback', error);
            await downloadGuideHtml();
        } finally {
            if (button) {
                button.innerHTML = '<i class="fa-solid fa-book-open"></i> Guide';
                button.disabled = false;
            }
        }
    };

    window.exportToHTML = async function () {
        if (slidesData.length === 0) {
            showModal('다운로드할 슬라이드가 없습니다!');
            return;
        }

        const button = document.getElementById('dl-html-btn');
        if (button) {
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중..';
            button.disabled = true;
        }

        try {
            await downloadGuideHtml();
        } catch (error) {
            console.error('[Phase5] exportToHTML failed', error);
            showModal('HTML 다운로드용 이미지를 준비하는 중 오류가 발생했습니다.\n' + error.message);
        } finally {
            if (button) {
                button.innerHTML = '<i class="fa-solid fa-file-code"></i> HTML';
                button.disabled = false;
            }
        }
    };

    window.__phase5ResolveImageSource = resolveSlideImageSource;
    window.__phase5GenerateGuideHtml = generateGuideHtml;
})();
