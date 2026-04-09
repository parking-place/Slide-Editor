// Auto-extracted modular feature: Export

// --- Extracted from src/webp_phase5.js ---

(function () {
    'use strict';

    function buildGuideDownloadName(projectName) {
        const safeName = String(projectName || 'My Guide')
            .trim()
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ')
            || 'My Guide';
        return `${safeName}.html`;
    }

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

    function buildPortableImageCandidates(slide, resolvedSource) {
        const asset = slide && slide.imageAsset ? slide.imageAsset : null;
        return Array.from(new Set(
            [
                resolvedSource,
                asset?.originalUrl,
                asset?.fileUrl,
                slide?.image
            ].filter((value) => typeof value === 'string' && value.trim() !== '')
        ));
    }

    async function toPortableImageSource(slide, resolvedSource) {
        const candidates = buildPortableImageCandidates(slide, resolvedSource);
        if (!candidates.length) return null;

        for (const candidate of candidates) {
            if (isInlineImageData(candidate)) {
                return candidate;
            }

            const normalized = getSlideImageSrc(candidate);
            if (!normalized) {
                continue;
            }

            if (!isStoredImagePath(normalized) && !/^\/api\/projects\/[^/]+\/images\/[^/]+\/(?:file|original)$/.test(normalized.replace(/\\/g, '/'))) {
                return normalized;
            }

            try {
                return await fetchImageAsDataUrl(normalized);
            } catch (error) {
                console.warn('[guide-export] image fallback failed', normalized, error);
            }
        }

        return null;
    }

    async function buildExportSlides(slides, portable) {
        const exportedSlides = cloneSlidesForExport(slides);

        await Promise.all(exportedSlides.map(async (slide) => {
            const resolvedSource = resolveSlideImageSource(slide);
            if (!resolvedSource) {
                slide.image = null;
                if (portable) {
                    slide.imageAsset = null;
                }
                return;
            }

            slide.image = portable
                ? await toPortableImageSource(slide, resolvedSource)
                : getSlideImageSrc(resolvedSource);
            if (portable) {
                slide.imageAsset = null;
            }
        }));

        return exportedSlides;
    }

    buildPortableSlides = async function (slides) {
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
        const rootStyles = getComputedStyle(document.documentElement);
        const editorAccentColor = rootStyles.getPropertyValue('--hpe-green').trim() || activeTheme?.colors?.accent || accentColor;
        const editorSecondaryAccent = rootStyles.getPropertyValue('--secondary-accent').trim() || activeTheme?.colors?.secondaryAccent || accentColor;
        const editorAccentGlow = rootStyles.getPropertyValue('--accent-glow').trim() || editorAccentColor;
        const editorBgDark = rootStyles.getPropertyValue('--bg-dark').trim() || (bodyClass === 'light-mode' ? '#f3f4f6' : '#010409');
        const editorSlideBg = rootStyles.getPropertyValue('--slide-bg').trim() || (bodyClass === 'light-mode' ? '#ffffff' : '#0D1117');
        const editorBoxBg = rootStyles.getPropertyValue('--box-bg').trim() || (bodyClass === 'light-mode' ? '#f9fafb' : '#161B22');
        const editorBorderColor = rootStyles.getPropertyValue('--border-color').trim() || (bodyClass === 'light-mode' ? '#e5e7eb' : '#30363D');
        const editorTextMain = rootStyles.getPropertyValue('--text-main').trim() || (bodyClass === 'light-mode' ? '#111827' : '#f8fafc');
        const editorTextDim = rootStyles.getPropertyValue('--text-dim').trim() || (bodyClass === 'light-mode' ? '#4b5563' : '#8b949e');
        const guideCodeColor = rootStyles.getPropertyValue('--code-color').trim() || themeGuide.codeColor || activeTheme?.colors?.codeColor || darkAccent;
        const footerCopy = branding.footerCopy || branding.projectName || 'My Guide';
        const navigatorModel = buildGuideNavigatorModel(sourceSlides);
        const bodyClass = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
        const codeBlockBorder = bodyClass === 'light-mode'
            ? 'rgba(15, 23, 42, 0.12)'
            : 'rgba(255, 255, 255, 0.12)';
        const codeBlockHeaderBg = bodyClass === 'light-mode'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))';
        const codeBlockButtonBg = bodyClass === 'light-mode'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(255, 255, 255, 0.04)';
        const codeBlockButtonHoverBg = bodyClass === 'light-mode'
            ? 'rgba(255, 255, 255, 0.16)'
            : 'rgba(255, 255, 255, 0.10)';
        const codeBlockButtonText = bodyClass === 'light-mode'
            ? '#e2e8f0'
            : '#cbd5e1';
        const codeBlockBackground = bodyClass === 'light-mode'
            ? 'linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.76))'
            : 'linear-gradient(180deg, rgba(15,23,42,0.84), rgba(2,6,23,0.72))';
        const guideScrollTrack = bodyClass === 'light-mode'
            ? 'rgba(226, 232, 240, 0.75)'
            : 'rgba(15, 23, 42, 0.72)';
        const guideScrollThumb = bodyClass === 'light-mode'
            ? `color-mix(in srgb, ${accentColor} 32%, #94a3b8 68%)`
            : `color-mix(in srgb, ${accentColor} 44%, rgba(148, 163, 184, 0.42) 56%)`;
        const guideScrollThumbHover = bodyClass === 'light-mode'
            ? `color-mix(in srgb, ${accentColor} 58%, #475569 42%)`
            : `color-mix(in srgb, ${accentColor} 70%, #f8fafc 30%)`;
        const guideScrollBorder = bodyClass === 'light-mode'
            ? 'rgba(255, 255, 255, 0.92)'
            : 'rgba(15, 23, 42, 0.86)';
        const guideGlassRgb = rootStyles.getPropertyValue('--glass-rgb').trim() || '255, 255, 255';
        const guideGlassAlpha = rootStyles.getPropertyValue('--glass-alpha').trim() || (bodyClass === 'light-mode' ? '0.36' : '0.11');
        const guideGlassBlur = rootStyles.getPropertyValue('--glass-blur').trim() || (bodyClass === 'light-mode' ? '10px' : '14px');
        const guideGlassSaturation = rootStyles.getPropertyValue('--glass-saturation').trim() || (bodyClass === 'light-mode' ? '114%' : '126%');
        const guideGlassRefraction = rootStyles.getPropertyValue('--glass-refraction').trim() || (bodyClass === 'light-mode' ? '0.08' : '0.12');
        const guideGlassDepth = rootStyles.getPropertyValue('--glass-depth').trim() || (bodyClass === 'light-mode' ? '0.14' : '0.24');
        const guideGlassBorderAlpha = rootStyles.getPropertyValue('--glass-border-alpha').trim() || (bodyClass === 'light-mode' ? '0.30' : '0.20');
        const guideGlassShadowAlpha = rootStyles.getPropertyValue('--glass-shadow-alpha').trim() || (bodyClass === 'light-mode' ? '0.08' : '0.15');
        const guideGlassHighlightAlpha = rootStyles.getPropertyValue('--glass-highlight-alpha').trim() || (bodyClass === 'light-mode' ? '0.30' : '0.21');
        const guideSurfaceNoiseOpacity = rootStyles.getPropertyValue('--surface-noise-opacity').trim() || (bodyClass === 'light-mode' ? '0.03' : '0.055');
        const guideHeaderText = editorTextMain;
        const guideHeaderSubtext = bodyClass === 'light-mode' ? '#334155' : 'rgba(248,250,252,0.92)';
        const guideNavText = editorTextDim;
        const guideNavTextStrong = editorTextMain;
        const guideActiveText = bodyClass === 'light-mode'
            ? `color-mix(in srgb, ${accentColor} 76%, #0f172a 24%)`
            : `color-mix(in srgb, ${accentColor} 82%, #f8fafc 18%)`;
        const guideGlassStrong = bodyClass === 'light-mode' ? 'rgba(255,255,255,0.94)' : 'rgba(13,17,23,0.78)';
        const guideGlassSoft = bodyClass === 'light-mode' ? 'rgba(255,255,255,0.82)' : 'rgba(13,17,23,0.54)';

        const cardsHtml = sourceSlides.map((slide, index) => {
            const imageSrc = getSlideImageSrc(resolveSlideImageSource(slide) || slide.image);
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
        :root {
            color-scheme: ${bodyClass === 'light-mode' ? 'light' : 'dark'};
            --glass-rgb: ${guideGlassRgb};
            --glass-alpha: ${guideGlassAlpha};
            --glass-blur: ${guideGlassBlur};
            --glass-saturation: ${guideGlassSaturation};
            --glass-refraction: ${guideGlassRefraction};
            --glass-depth: ${guideGlassDepth};
            --glass-border-alpha: ${guideGlassBorderAlpha};
            --glass-shadow-alpha: ${guideGlassShadowAlpha};
            --glass-highlight-alpha: ${guideGlassHighlightAlpha};
            --surface-noise-opacity: ${guideSurfaceNoiseOpacity};
            --secondary-accent: ${editorSecondaryAccent};
            --accent-glow: ${editorAccentGlow};
            --guide-bg-dark: ${editorBgDark};
            --guide-slide-bg: ${editorSlideBg};
            --guide-box-bg: ${editorBoxBg};
            --guide-border-color: ${editorBorderColor};
            --guide-text-main: ${editorTextMain};
            --guide-text-dim: ${editorTextDim};
            --surface-grid-dot: ${bodyClass === 'light-mode' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'};
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body,
        .guide-aside,
        .guide-main,
        .markdown-body pre {
            scrollbar-width: thin;
            scrollbar-color: ${guideScrollThumb} ${guideScrollTrack};
        }
        body::-webkit-scrollbar,
        .guide-aside::-webkit-scrollbar,
        .guide-main::-webkit-scrollbar,
        .markdown-body pre::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        body::-webkit-scrollbar-track,
        .guide-aside::-webkit-scrollbar-track,
        .guide-main::-webkit-scrollbar-track,
        .markdown-body pre::-webkit-scrollbar-track {
            background: ${guideScrollTrack};
            border-radius: 999px;
        }
        body::-webkit-scrollbar-thumb,
        .guide-aside::-webkit-scrollbar-thumb,
        .guide-main::-webkit-scrollbar-thumb,
        .markdown-body pre::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, ${guideScrollThumbHover}, ${guideScrollThumb});
            border-radius: 999px;
            border: 2px solid ${guideScrollBorder};
            min-height: 28px;
        }
        body::-webkit-scrollbar-thumb:hover,
        .guide-aside::-webkit-scrollbar-thumb:hover,
        .guide-main::-webkit-scrollbar-thumb:hover,
        .markdown-body pre::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, ${guideScrollThumbHover}, color-mix(in srgb, ${guideScrollThumb} 78%, ${guideScrollThumbHover} 22%));
        }
        body {
            margin: 0;
            font-family: 'Pretendard', 'Segoe UI', sans-serif;
            color: var(--guide-text-main);
            background:
                radial-gradient(circle at top right, color-mix(in srgb, ${editorAccentColor} 20%, transparent), transparent 24%),
                radial-gradient(circle at 16% 14%, color-mix(in srgb, var(--guide-text-main) 10%, transparent), transparent 22%),
                linear-gradient(135deg, color-mix(in srgb, var(--guide-bg-dark) 92%, #09101c 8%), color-mix(in srgb, var(--guide-bg-dark) 90%, #05271f 10%));
            background-attachment: fixed;
            position: relative;
        }
        body.light-mode {
            background:
                radial-gradient(circle at top right, color-mix(in srgb, var(--secondary-accent) 18%, transparent), transparent 22%),
                radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--accent-glow) 26%, transparent), transparent 26%),
                linear-gradient(135deg, color-mix(in srgb, var(--guide-bg-dark) 94%, #ffffff 6%), color-mix(in srgb, var(--guide-bg-dark) 92%, #ecfeff 8%));
        }
        body::before,
        body::after {
            content: '';
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: -1;
        }
        body::before {
            background-image: radial-gradient(circle, var(--surface-grid-dot) 0.7px, transparent 0.8px);
            background-size: 14px 14px;
            opacity: 1;
        }
        body::after {
            opacity: var(--surface-noise-opacity);
            background-image:
                radial-gradient(circle at 12% 18%, rgba(255,255,255,0.9) 0.55px, transparent 0.9px),
                radial-gradient(circle at 74% 36%, rgba(255,255,255,0.7) 0.5px, transparent 0.85px),
                radial-gradient(circle at 48% 72%, rgba(255,255,255,0.6) 0.45px, transparent 0.8px),
                radial-gradient(circle at 82% 82%, rgba(255,255,255,0.8) 0.4px, transparent 0.78px),
                radial-gradient(circle at 24% 58%, rgba(255,255,255,0.75) 0.45px, transparent 0.8px),
                radial-gradient(circle at 64% 12%, rgba(255,255,255,0.55) 0.35px, transparent 0.72px);
            background-size: 64px 64px, 88px 88px, 72px 72px, 96px 96px, 80px 80px, 70px 70px;
            mix-blend-mode: soft-light;
            filter: contrast(116%) saturate(108%);
        }
        .guide-header {
            background:
                linear-gradient(180deg, color-mix(in srgb, ${headerBg} 14%, rgba(var(--glass-rgb), calc(var(--glass-alpha) + 0.08)) 86%), color-mix(in srgb, ${headerBg} 8%, rgba(var(--glass-rgb), calc(var(--glass-alpha) * 0.34)) 92%)),
                radial-gradient(circle at 18% 16%, color-mix(in srgb, ${editorSecondaryAccent} 18%, transparent), transparent 54%);
            color: ${guideHeaderText};
            padding: 48px 24px;
            text-align: center;
            border: 1px solid color-mix(in srgb, rgba(var(--glass-rgb), var(--glass-border-alpha)) 56%, var(--guide-border-color) 44%);
            border-radius: 0 0 20px 20px;
            box-shadow:
                0 calc(8px + 14px * var(--glass-depth)) calc(18px + 22px * var(--glass-depth)) rgba(0, 0, 0, calc(var(--glass-shadow-alpha) * 0.78)),
                inset 0 1px 0 rgba(255,255,255, calc(var(--glass-highlight-alpha) * 0.8));
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
        }
        .guide-header h1 { margin: 0 0 8px; font-size: 34px; }
        .guide-header p { margin: 0; font-size: 18px; color: ${guideHeaderSubtext}; }
        .guide-layout { max-width: 1400px; margin: 0 auto; display: flex; gap: 0; padding: 24px 20px; align-items: flex-start; }
        .guide-aside {
            width: 240px;
            flex-shrink: 0;
            position: sticky;
            top: 24px;
            max-height: calc(100vh - 48px);
            overflow-y: auto;
            padding: 20px 16px;
            border: 1px solid color-mix(in srgb, rgba(var(--glass-rgb), var(--glass-border-alpha)) 64%, var(--guide-border-color) 36%);
            border-radius: 18px;
            background: linear-gradient(180deg, rgba(var(--glass-rgb), calc(var(--glass-alpha) + 0.03)), rgba(var(--glass-rgb), calc(var(--glass-alpha) * 0.46)));
            box-shadow:
                0 calc(10px + 12px * var(--glass-depth)) calc(22px + 24px * var(--glass-depth)) rgba(0, 0, 0, calc(var(--glass-shadow-alpha) + 0.02)),
                inset 0 1px 0 rgba(255,255,255, calc(var(--glass-highlight-alpha) * 0.82));
            backdrop-filter: blur(calc(var(--glass-blur) + 2px)) saturate(var(--glass-saturation));
            -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 2px)) saturate(var(--glass-saturation));
        }
        .guide-aside .toc-sidebar-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${guideNavText}; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid rgba(148,163,184,0.2); }
        .guide-aside .toc-nav-chapter { font-size: 12px; font-weight: 700; color: ${accentColor}; margin-top: 14px; margin-bottom: 4px; padding: 0 6px; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .guide-aside .toc-nav-chapter:first-child { margin-top: 0; }
        .guide-aside .toc-nav-middle { font-size: 12px; font-weight: 600; color: ${guideNavText}; padding: 3px 6px 3px 14px; margin-bottom: 2px; border-radius: 5px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .guide-aside .toc-nav-middle:hover,
        .guide-aside .toc-nav-middle:focus-visible { background: color-mix(in srgb, ${editorSecondaryAccent} 16%, transparent); color: ${editorSecondaryAccent}; padding-left: 18px; outline: none; }
        .guide-aside .toc-nav-title { font-size: 12px; color: ${guideNavText}; padding: 4px 6px 4px 24px; border-radius: 5px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease, border-left 0.15s ease; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 2px solid transparent; }
        .guide-aside .toc-nav-title:hover,
        .guide-aside .toc-nav-title:focus-visible { background: ${bodyClass === 'light-mode' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}; color: ${guideNavTextStrong}; padding-left: 27px; outline: none; }
        .guide-aside .toc-nav-title.active {
            color: ${guideActiveText};
            background: linear-gradient(180deg, color-mix(in srgb, ${editorAccentColor} 16%, ${guideGlassStrong} 84%), color-mix(in srgb, ${editorAccentColor} 9%, ${guideGlassSoft} 91%));
            border-left: 2px solid ${editorAccentColor};
            box-shadow:
                inset 0 1px 0 rgba(255,255,255, calc(var(--glass-highlight-alpha) + 0.04)),
                0 6px 16px rgba(15, 23, 42, calc(var(--glass-shadow-alpha) * 0.55));
            font-weight: 600;
        }
        .guide-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 24px; }
        .guide-card {
            background: linear-gradient(180deg, rgba(var(--glass-rgb), calc(var(--glass-alpha) + 0.03)), rgba(var(--glass-rgb), calc(var(--glass-alpha) * 0.46)));
            border: 1px solid color-mix(in srgb, rgba(var(--glass-rgb), var(--glass-border-alpha)) 64%, var(--guide-border-color) 36%);
            border-radius: 18px;
            overflow: hidden;
            box-shadow:
                0 calc(10px + 12px * var(--glass-depth)) calc(22px + 24px * var(--glass-depth)) rgba(0, 0, 0, calc(var(--glass-shadow-alpha) + 0.02)),
                inset 0 1px 0 rgba(255,255,255, calc(var(--glass-highlight-alpha) * 0.82));
            backdrop-filter: blur(calc(var(--glass-blur) + 2px)) saturate(var(--glass-saturation));
            -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 2px)) saturate(var(--glass-saturation));
        }
        .guide-card-header {
            padding: 24px 28px 18px;
            border-left: 4px solid ${editorAccentColor};
            background: linear-gradient(180deg, rgba(var(--glass-rgb), calc(var(--glass-alpha) + 0.08)), rgba(var(--glass-rgb), calc(var(--glass-alpha) * 0.32)));
            border-bottom: 1px solid color-mix(in srgb, rgba(var(--glass-rgb), var(--glass-border-alpha)) 64%, var(--guide-border-color) 36%);
        }
        .guide-chapter { margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${editorAccentColor}; }
        .guide-middle-title { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: ${guideNavText}; }
        .guide-title { margin: 0; font-size: 28px; line-height: 1.25; color: inherit; }
        .guide-card-body { display: flex; gap: 24px; padding: 28px; flex-wrap: wrap; }
        .guide-text {
            min-width: 280px;
            padding: 20px;
            border-radius: 6px;
            background: linear-gradient(180deg, rgba(var(--glass-rgb), calc(var(--glass-alpha) + 0.04)), var(--guide-box-bg));
            border: 1px solid var(--guide-border-color);
        }
        .guide-figure {
            min-width: 280px;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px;
            border-radius: 6px;
            background: linear-gradient(180deg, rgba(var(--glass-rgb), calc(var(--glass-alpha) + 0.04)), var(--guide-box-bg));
            border: 1px solid var(--guide-border-color);
        }
        .guide-figure img { max-width: 100%; border-radius: 14px; border: 1px solid rgba(148,163,184,0.2); box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16); }
        .guide-figure img[data-guide-zoomable="true"] { cursor: zoom-in; transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .guide-figure img[data-guide-zoomable="true"]:hover,
        .guide-figure img[data-guide-zoomable="true"]:focus-visible { transform: scale(1.01); box-shadow: 0 14px 34px rgba(15, 23, 42, 0.22); outline: none; }
        .guide-figure figcaption { margin-top: 10px; font-size: 13px; color: ${bodyClass === 'light-mode' ? '#475569' : '#cbd5e1'}; text-align: center; }
        .markdown-body p { margin: 0 0 0.8em; white-space: pre-wrap; word-break: break-word; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { color: ${accentColor}; margin: 1em 0 0.5em; }
        .markdown-body h1:first-child, .markdown-body h2:first-child, .markdown-body h3:first-child { margin-top: 0; }
        .markdown-body ul, .markdown-body ol { padding-left: 20px; margin: 0 0 1em; }
        .markdown-body :not(pre) > code { background: ${guideCodeColor}1A; color: ${guideCodeColor}; padding: 2px 5px; border-radius: 4px; font-family: 'D2Coding', monospace; font-size: 0.9em; }
        .code-block-wrapper {
            margin-top: 10px;
            margin-bottom: 10px;
            border: 1px solid ${codeBlockBorder};
            border-left: 3px solid ${editorAccentColor};
            border-radius: 10px;
            overflow: hidden;
            background: ${codeBlockBackground};
            box-shadow: 0 14px 28px rgba(2, 6, 23, 0.24), inset 0 1px 0 rgba(255,255,255,0.06);
            backdrop-filter: blur(calc(var(--glass-blur) * 0.55)) saturate(calc(var(--glass-saturation) - 6%));
            -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.55)) saturate(calc(var(--glass-saturation) - 6%));
        }
        .code-block-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 12px; background: ${codeBlockHeaderBg}; border-bottom: 1px solid ${codeBlockBorder}; }
        .code-lang-label { font-family: 'D2Coding', monospace; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: ${guideCodeColor}; }
        .btn-copy-code { display: inline-flex; align-items: center; gap: 6px; border: 1px solid ${codeBlockBorder}; border-radius: 999px; background: ${codeBlockButtonBg}; color: ${codeBlockButtonText}; font-size: 12px; font-weight: 600; padding: 4px 10px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease; }
        .btn-copy-code:hover, .btn-copy-code:focus-visible { background: ${codeBlockButtonHoverBg}; color: ${guideCodeColor}; border-color: ${guideCodeColor}; outline: none; }
        .btn-copy-code.copied { color: ${guideCodeColor}; border-color: ${guideCodeColor}; }
        .code-block-wrapper pre { margin: 0; overflow-x: auto; background: transparent; border: none; border-radius: 0; padding: 15px; }
        .code-block-wrapper pre code.hljs { display: block; overflow-x: auto; padding: 0; background: transparent; color: inherit; }
        .guide-footer {
            max-width: 1440px;
            margin: 0 auto 32px;
            padding: 0 24px;
            color: ${bodyClass === 'light-mode' ? '#475569' : '#cbd5e1'};
            font-size: 13px;
        }
        .guide-lightbox[hidden] { display: none; }
        .guide-lightbox { position: fixed; inset: 0; z-index: 10000; background: rgba(2, 6, 23, 0.82); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(8px); }
        .guide-lightbox-figure { margin: 0; max-width: min(92vw, 1440px); max-height: 92vh; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .guide-lightbox-image { max-width: 100%; max-height: calc(92vh - 64px); object-fit: contain; border-radius: 18px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45); background: rgba(15, 23, 42, 0.4); }
        .guide-lightbox-caption { font-size: 14px; text-align: center; color: #e2e8f0; }
        .guide-lightbox-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; border: none; border-radius: 999px; background: rgba(255, 255, 255, 0.14); color: #fff; font-size: 28px; line-height: 1; cursor: pointer; }
        .guide-lightbox-close:hover,
        .guide-lightbox-close:focus-visible { background: rgba(255, 255, 255, 0.24); outline: none; }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
            .guide-header,
            .guide-aside,
            .guide-card {
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                background: ${bodyClass === 'light-mode' ? 'rgba(255,255,255,0.92)' : 'rgba(13,17,23,0.92)'};
            }
        }
        @media (max-width: 1100px) {
            .guide-layout { flex-direction: column; }
            .guide-aside { width: 100%; position: static; max-height: none; border-right: none; border-bottom: 1px solid rgba(148,163,184,0.2); margin-bottom: 16px; }
        }
        @media (max-width: 720px) {
            .guide-header { padding: 36px 18px; border-radius: 0 0 16px 16px; }
            .guide-layout { padding: 18px 14px; }
            .guide-card-header { padding: 20px 20px 16px; }
            .guide-card-body { padding: 20px; gap: 16px; }
            .guide-text,
            .guide-figure { padding: 16px; }
        }
    </style>
</head>
<body class="${bodyClass}">
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

            window.copyCode = function (button) {
                var codeElement = button && button.closest('.code-block-wrapper')
                    ? button.closest('.code-block-wrapper').querySelector('code')
                    : null;
                var code = codeElement ? codeElement.innerText : '';
                if (!code) return;

                function markCopied() {
                    button.innerHTML = '<i class="fa-solid fa-check"></i> 복사됨';
                    button.classList.add('copied');
                    window.setTimeout(function () {
                        button.innerHTML = '<i class="fa-regular fa-copy"></i> 복사';
                        button.classList.remove('copied');
                    }, 2000);
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(code).then(markCopied).catch(function () {});
                    return;
                }

                var textarea = document.createElement('textarea');
                textarea.value = code;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                markCopied();
            };

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
        anchor.download = buildGuideDownloadName(currentProject?.name || projectSettings?.branding?.projectName || 'My Guide');
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
    window.__buildGuideDownloadName = buildGuideDownloadName;
})();
