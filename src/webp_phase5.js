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

    function buildTocLines(sourceSlides) {
        const lines = [];
        let previousChapter = null;
        let previousMiddleTitle = null;

        sourceSlides.forEach((slide, index) => {
            const chapter = slide.chapter || 'Untitled Chapter';
            const middleTitle = slide.middleTitle || '';
            const title = slide.title || `Slide ${index + 1}`;

            if (chapter !== previousChapter) {
                lines.push({ type: 'chapter', text: chapter, index });
                previousChapter = chapter;
                previousMiddleTitle = null;
            }

            if (middleTitle && middleTitle !== previousMiddleTitle) {
                lines.push({ type: 'middle', text: middleTitle, index });
                previousMiddleTitle = middleTitle;
            }

            lines.push({ type: 'title', text: title, index });
        });

        return lines;
    }

    function generateGuideHtml(sourceSlides = slidesData) {
        const themeGuide = (activeTheme && activeTheme.webGuide) || {};
        const branding = projectSettings.branding || {};
        const accentColor = themeGuide.accentColor || '#01a982';
        const headerBg = themeGuide.headerBg || accentColor;
        const darkAccent = themeGuide.darkAccent || '#00e676';
        const footerCopy = branding.footerCopy || branding.projectName || 'My Guide';
        const tocLines = buildTocLines(sourceSlides);
        const bodyClass = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';

        const tocHtml = tocLines.map((line) => {
            if (line.type === 'chapter') {
                return `<li class="guide-toc-chapter">${escapeHtml(line.text)}</li>`;
            }
            if (line.type === 'middle') {
                return `<li><a class="guide-toc-middle" href="#guide-slide-${line.index}">${escapeHtml(line.text)}</a></li>`;
            }
            return `<li><a class="guide-toc-item" href="#guide-slide-${line.index}">${escapeHtml(line.text)}</a></li>`;
        }).join('');

        const cardsHtml = sourceSlides.map((slide, index) => {
            const imageSrc = slide.image ? getSlideImageSrc(slide.image) : resolveSlideImageSource(slide);
            const parsedMarkdownText = marked.parse(slide.text || '');
            const hasText = Boolean(slide.text && slide.text.trim());
            const hasImage = Boolean(imageSrc);
            const textRatio = slide.textRatio || 50;
            const textFlex = hasText && hasImage ? textRatio : 100;
            const imageFlex = hasText && hasImage ? (100 - textRatio) : 100;
            const middleTitleHtml = slide.middleTitle ? `<p class="guide-middle-title">${escapeHtml(slide.middleTitle)}</p>` : '';
            const imageHtml = hasImage ? `
                <figure class="guide-figure" style="flex:${imageFlex};">
                    <picture>
                        <img src="${imageSrc}" alt="${escapeHtml(slide.title || `Slide ${index + 1}`)}" loading="lazy" decoding="async">
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
                <article class="guide-card" id="guide-slide-${index}">
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
        .guide-layout { max-width: 1440px; margin: 0 auto; display: flex; gap: 24px; padding: 24px; align-items: flex-start; }
        .guide-aside { width: 260px; position: sticky; top: 24px; border: 1px solid rgba(148,163,184,0.2); border-radius: 16px; padding: 18px 16px; background: ${bodyClass === 'light-mode' ? '#ffffff' : '#0f172a'}; }
        .guide-aside h2 { margin: 0 0 12px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: ${accentColor}; }
        .guide-aside ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .guide-toc-chapter { margin-top: 10px; font-size: 12px; font-weight: 700; color: ${accentColor}; }
        .guide-toc-middle, .guide-toc-item { display: block; text-decoration: none; color: inherit; border-radius: 8px; padding: 6px 8px; }
        .guide-toc-middle:hover, .guide-toc-item:hover { background: rgba(1, 169, 130, 0.12); }
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
        .guide-figure figcaption { margin-top: 10px; font-size: 13px; color: ${bodyClass === 'light-mode' ? '#475569' : '#cbd5e1'}; text-align: center; }
        .markdown-body p { margin: 0 0 0.8em; white-space: pre-wrap; word-break: break-word; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { color: ${accentColor}; margin: 1em 0 0.5em; }
        .markdown-body h1:first-child, .markdown-body h2:first-child, .markdown-body h3:first-child { margin-top: 0; }
        .markdown-body ul, .markdown-body ol { padding-left: 20px; margin: 0 0 1em; }
        .markdown-body code { background: rgba(1, 169, 130, 0.14); color: ${darkAccent}; padding: 2px 6px; border-radius: 6px; font-family: 'D2Coding', monospace; }
        .markdown-body pre { margin: 0 0 1em; overflow-x: auto; background: #0f172a; border: 1px solid rgba(148,163,184,0.2); border-left: 4px solid ${accentColor}; border-radius: 12px; padding: 16px; }
        .markdown-body pre code { background: transparent; color: inherit; padding: 0; }
        .guide-footer { max-width: 1440px; margin: 0 auto 32px; padding: 0 24px; color: ${bodyClass === 'light-mode' ? '#475569' : '#cbd5e1'}; font-size: 13px; }
        @media (max-width: 1100px) {
            .guide-layout { flex-direction: column; }
            .guide-aside { width: 100%; position: static; }
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
            <h2>Navigator</h2>
            <ul>${tocHtml}</ul>
        </aside>
        <main class="guide-main">
            ${cardsHtml}
        </main>
    </div>
    <footer class="guide-footer">
        ${escapeHtml(footerCopy)} · Generated by Slide Editor
    </footer>
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
