// Auto-extracted modular segment: Export Base

window.exportToPPTX = async function() {
            if (slidesData.length === 0) {
                showModal('다운로드할 슬라이드를 먼저 추가해주세요!');
                return;
            }

            const btn = document.getElementById('dl-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 파일 생성 중...';

            // 테마 및 브랜딩 변수 추출 (없으면 기본값)
            const tp = (activeTheme && activeTheme.pptx) ? activeTheme.pptx : {};
            const br = projectSettings.branding;
            const pMasterBg      = tp.masterBg      || '0D1117';
            const pCoverBg       = tp.coverBg       || '010409';
            const pMiddleCoverBg = tp.middleCoverBg || '111827';
            const pAccent        = tp.accentColor   || '00E676';
            const pCodeColor     = tp.codeColor     || '00E676';
            const pTextColor     = tp.textColor     || 'C9D1D9';
            const pDimColor      = tp.dimColor      || '8B949E';
            const pFont  = (activeTheme && activeTheme.fonts) ? activeTheme.fonts.pptxBody  || 'Malgun Gothic' : 'Malgun Gothic';
            const pFontT = (activeTheme && activeTheme.fonts) ? activeTheme.fonts.pptxTitle || 'Arial'         : 'Arial';
            const projectName   = br.projectName   || 'My Guide';
            const guideSubtitle = br.guideSubtitle || '';
            const footerCopy    = br.footerCopy    || 'My Guide';

            let pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';

            // 마스터 정의
            pptx.defineSlideMaster({
                title: 'VME_MASTER',
                background: { color: pMasterBg },
                objects: [
                    { rect: { x: 0.5, y: 5.1, w: 9.0, h: 0.01, fill: { color: '30363D' } } },
                    { text: { text: footerCopy, options: { x: 0.5, y: 5.2, w: 6, h: 0.3, color: pDimColor, fontSize: 10, fontFace: pFontT } } }
                ],
                slideNumber: { x: 9.3, y: 5.2, color: pDimColor, fontSize: 10 }
            });

            // 1. 표지 슬라이드
            let slide0 = pptx.addSlide();
            slide0.background = { color: pCoverBg };
            slide0.addText(projectName, {
                x: 0.8, y: 1.8, w: 8.5, h: 1.5, fontSize: 44, color: 'FFFFFF', bold: true, fontFace: pFontT
            });
            slide0.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.5, w: 0.04, h: 0.6, fill: { color: pAccent } });
            slide0.addText(guideSubtitle, {
                x: 1.0, y: 3.5, w: 8, h: 0.6, fontSize: 22, color: pDimColor, fontFace: pFont
            });

            // 2. TOC 생성
            const tocLines = generateTocData(slidesData);
            const tocPagesData = slidesData.length > 0 ? paginateTocData(tocLines) : [];
            const tocPages = tocPagesData.length;

            for (let p = 0; p < tocPages; p++) {
                let tocSlide = pptx.addSlide({ masterName: 'VME_MASTER' });
                
                tocSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.5, w: 0.04, h: 0.4, fill: { color: 'FFFFFF' } });
                tocSlide.addText(`목차 (Table of Contents) ${tocPages > 1 ? `(${p+1}/${tocPages})` : ''}`, {
                    x: 0.6, y: 0.5, w: 8.5, h: 0.4, fontSize: 24, color: pAccent, bold: true, fontFace: pFont
                });

                let chunk = tocPagesData[p];
                let currentY = 1.3;

                chunk.forEach(line => {
                    if (line.type === 'chapter') {
                        tocSlide.addText(line.text, { x: 0.6, y: currentY, w: 8, h: 0.3, fontSize: 16, color: 'FFFFFF', bold: true, fontFace: pFont });
                    } else if (line.type === 'middle') {
                        tocSlide.addText(line.text, { x: 1.0, y: currentY, w: 7.5, h: 0.3, fontSize: 14, color: pDimColor, bold: true, fontFace: pFont });
                    } else if (line.type === 'title') {
                        let pageNum = 1 + tocPages + line.renderableIndex + 1;
                        tocSlide.addText(line.text, { x: 1.4, y: currentY, w: 6.5, h: 0.3, fontSize: 13, color: pTextColor, fontFace: pFont });
                        tocSlide.addText(pageNum.toString(), { x: 8.5, y: currentY, w: 0.5, h: 0.3, fontSize: 13, color: pAccent, fontFace: pFont, align: 'right', bold: true });
                    }
                    currentY += 0.25; // 줄 간격
                });
            }

            const pptxSlides = await buildPptxSlides(slidesData);

            // 3. 본문 슬라이드 생성
            let prevChPPTX = null;
            let prevMidPPTX = null;
            pptxSlides.forEach(data => {
                let ch = data.chapter || '대제목 미지정';
                let mid = data.middleTitle || '';
                
                if (ch !== prevChPPTX) {
                    prevChPPTX = ch;
                    prevMidPPTX = null;
                }
                
                if (mid && mid !== prevMidPPTX) {
                    let coverSlide = pptx.addSlide({ masterName: 'VME_MASTER' });
                    coverSlide.background = { color: pMiddleCoverBg };
                    coverSlide.addText(ch, { x: 0.5, y: 2.2, w: 9, h: 0.5, fontSize: 24, color: pAccent, bold: true, align: 'center', fontFace: pFont });
                    coverSlide.addText(mid, { x: 0.5, y: 2.8, w: 9, h: 1.0, fontSize: 44, color: 'FFFFFF', bold: true, align: 'center', fontFace: pFontT });
                    
                    prevMidPPTX = mid;
                }

                let slide = pptx.addSlide({ masterName: 'VME_MASTER' });

                // 중제목 유무에 따라 상단 제목부의 Y 위치 조절
                let chapterY = data.middleTitle ? 0.25 : 0.4;
                
                slide.addText(data.chapter, {
                    x: 0.5, y: chapterY, w: 9, h: 0.3, fontSize: 11, color: pAccent, bold: true, fontFace: pFont
                });

                if (data.middleTitle) {
                    slide.addText(data.middleTitle, {
                        x: 0.5, y: 0.5, w: 9, h: 0.3, fontSize: 14, color: pDimColor, bold: true, fontFace: pFont
                    });
                }

                let titleY = data.middleTitle ? 0.8 : 0.7;

                slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: titleY, w: 0.02, h: 0.5, fill: { color: pAccent } });
                slide.addText(data.title, {
                    x: 0.6, y: titleY, w: 9, h: 0.5, fontSize: 26, color: 'FFFFFF', bold: true, fontFace: pFont
                });

                const hasText = data.text && data.text.trim() !== '';
                const hasImage = !!data.image;
                const isImageOnly = !hasText && hasImage;

                if (isImageOnly) {
                    // 이미지만 있을 경우 전체 영역 차지
                    let imgH = data.imageCaption ? 3.0 : 3.3; // 캡션이 있으면 이미지 높이를 조금 줄임
                    slide.addImage({
                        data: data.image,
                        x: 0.5, y: 1.5, w: 9.0, h: imgH, 
                        sizing: { type: 'contain', w: 9.0, h: imgH }
                    });
                    
                    if (data.imageCaption) {
                        slide.addText(data.imageCaption, {
                            x: 0.5, y: 1.5 + imgH, w: 9.0, h: 0.3, fontSize: 11, color: pDimColor, align: 'center', fontFace: pFont
                        });
                    }
                } else {
                    // 기존 레이아웃 (텍스트 + 이미지, 또는 텍스트 단독)
                    let currentRatio = data.textRatio || 50;
                    let textWidth = 8.8; 
                    let boxWidth = 9.0;
                    let imgWidth = 0;
                    let imgX = 5.2;

                    if (hasImage && hasText) {
                        boxWidth = 8.6 * (currentRatio / 100);
                        textWidth = boxWidth - 0.2;
                        imgWidth = 8.6 * ((100 - currentRatio) / 100);
                        imgX = 0.5 + boxWidth + 0.4;
                    } else if (hasImage) {
                        textWidth = 4.1;
                        boxWidth = 4.3;
                    }

                    slide.addShape(pptx.ShapeType.rect, {
                        x: 0.5, y: 1.5, w: boxWidth, h: 3.3, fill: { color: '161B22' }, line: { color: '30363D', width: 1 }
                    });
                    
                    // Markdown 파싱하여 일반 텍스트와 코드 블록 분리 렌더링
                    let currentY = 1.6;
                    const parts = (data.text || '').split(/(```[\s\S]*?```)/g);

                    parts.forEach(part => {
                        if (!part) return;
                        
                        let lines = part.split('\n').length;
                        let estimatedHeight = lines * 0.25; 
                        
                        if (part.startsWith('```')) {
                            // 코드 블록 (터미널 스타일 렌더링)
                            let codeContent = part.replace(/```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
                            
                            slide.addShape(pptx.ShapeType.rect, {
                                x: 0.6, y: currentY, w: textWidth, h: estimatedHeight, fill: { color: '010409' }, line: { color: '30363D', width: 1 }
                            });
                            
                            slide.addText(codeContent, {
                                x: 0.6, y: currentY, w: textWidth, h: estimatedHeight, fontSize: 11, color: pCodeColor, fontFace: 'D2Coding', valign: 'top', margin: 10
                            });
                            currentY += estimatedHeight + 0.1;
                        } else {
                            // 일반 텍스트 (마크다운 기호 제거)
                            let cleanPptText = part.replace(/\*\*(.*?)\*\*/g, '$1')
                                                   .replace(/__(.*?)__/g, '$1')
                                                   .replace(/`(.*?)`/g, '$1')
                                                   .replace(/^#+\s/gm, '');
                            if(cleanPptText.trim() === '') return;
                            
                            slide.addText(cleanPptText, {
                                x: 0.6, y: currentY, w: textWidth, h: estimatedHeight, fontSize: 14, color: pTextColor, fontFace: pFont, valign: 'top', margin: 10
                            });
                            currentY += estimatedHeight + 0.05;
                        }
                    });

                    if (hasImage) {
                        let finalImgWidth = (hasImage && hasText) ? imgWidth : 4.3;
                        let finalImgX = (hasImage && hasText) ? imgX : 5.2;
                        let imgH = data.imageCaption ? 3.0 : 3.3; // 캡션이 있으면 이미지 높이를 조금 줄임
                        slide.addImage({
                            data: data.image,
                            x: finalImgX, y: 1.5, w: finalImgWidth, h: imgH, 
                            sizing: { type: 'contain', w: finalImgWidth, h: imgH }
                        });
                        
                        if (data.imageCaption) {
                            slide.addText(data.imageCaption, {
                                x: finalImgX, y: 1.5 + imgH, w: finalImgWidth, h: 0.3, fontSize: 11, color: pDimColor, align: 'center', fontFace: pFont
                            });
                        }
                    }
                }
            });

            await pptx.writeFile({ fileName: `SlideEditor_Guide.pptx` });
            
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-file-export"></i> PPTX 다운로드';
        };

        // HTML 웹 가이드 문자열 템플릿 생성 헬퍼
        function generateHTMLContent(sourceSlides = slidesData) {
            // 테마 및 브랜딩 변수 추출 (없으면 기본값)
            const th = (activeTheme && activeTheme.webGuide) ? activeTheme.webGuide : { headerBg: '#01a982', accentColor: '#01a982', darkAccent: '#00e676', codeColor: '#00e676' };
            const br = projectSettings.branding;
            const headerBg    = th.headerBg    || '#01a982';
            const accentColor = th.accentColor || '#01a982';
            const darkAccent  = th.darkAccent  || '#00e676';
            const codeColor   = th.codeColor   || darkAccent;
            const projectName   = br.projectName   || 'HPE Virtual Machine Essentials (VME)';
            const guideSubtitle = br.guideSubtitle || '설치 및 구성 가이드';
            const footerCopy    = br.footerCopy    || 'My Guide';
            // 에디터의 현재 다크/라이트 모드를 웹 가이드에 그대로 적용
            const isLightMode   = document.body.classList.contains('light-mode');
            const bodyClass     = isLightMode ? '' : 'dark-mode';

            // TOC 페이지수 계산을 위해 필요
            const tocLines = generateTocData(sourceSlides);
            const tocPagesData = sourceSlides.length > 0 ? paginateTocData(tocLines) : [];
            const tocPages = tocPagesData.length;

            let htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slide Editor - Web Guide</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_three@1.5/D2Coding.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js"><\/script>
    
    <style>
        body { margin: 0; padding: 0; background: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; }
        html { scroll-behavior: smooth; }
        .header { background: ${headerBg}; color: #ffffff; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0 0 10px 0; font-size: 32px; }
        .header p { margin: 0; font-size: 18px; opacity: 0.9; }
        .container { max-width: 1000px; margin: -20px auto 40px auto; padding: 0 20px; position: relative; z-index: 10; }
        .card { background: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 40px; overflow: hidden; border: 1px solid #e5e7eb; }
        .card-header { padding: 20px 30px; border-bottom: 1px solid #e5e7eb; border-left: 6px solid ${accentColor}; background: #f9fafb; }
        .chapter { color: ${accentColor}; font-weight: 700; font-size: 14px; margin-bottom: 5px; }
        .middle-title { color: #6b7280; font-weight: 600; font-size: 16px; margin-bottom: 5px; }
        .title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
        .card-body { display: flex; flex-wrap: wrap; gap: 30px; padding: 30px; }
        .text-content { flex: 1; min-width: 300px; font-size: 15px; line-height: 1.7; color: #4b5563; }
        .img-content { flex: 1; min-width: 300px; display: flex; justify-content: center; align-items: flex-start; }
        .img-content img { max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05); cursor: zoom-in; transition: transform 0.2s; }
        .img-content img:hover { transform: scale(1.02); }
        .no-img { padding: 40px; text-align: center; border: 1px dashed #d1d5db; border-radius: 8px; color: #9ca3af; width: 100%; }
        .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 50px; }
        
        /* Markdown HTML Styles */
        .markdown-body p { margin-top: 0; margin-bottom: 0.8em; white-space: pre-wrap; word-break: break-word; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { color: ${accentColor}; margin-top: 1em; margin-bottom: 0.5em; font-weight: 700; }
        .markdown-body h1:first-child, .markdown-body h2:first-child, .markdown-body h3:first-child { margin-top: 0; }
        .markdown-body ul, .markdown-body ol { padding-left: 25px; margin-bottom: 1em; margin-top: 0; }
        .markdown-body li { margin-bottom: 0.3em; white-space: pre-wrap; word-break: break-word; }
        .markdown-body code { background: ${codeColor}1A; color: ${codeColor}; padding: 2px 5px; border-radius: 4px; font-family: 'D2Coding', monospace; font-size: 0.9em; }
        
        /* Markdown Code Block Styles */
        .markdown-body pre { background: #1e1e1e; color: ${accentColor}; padding: 15px; border-radius: 8px; overflow-x: auto; margin-top: 0; margin-bottom: 1em; border: 1px solid #e5e7eb; border-left: 3px solid ${accentColor};}
        .markdown-body pre code { background: transparent; color: inherit; padding: 0; font-size: 14px;}
        
        .markdown-body blockquote { border-left: 4px solid #d1d5db; margin: 0 0 1em 0; padding-left: 15px; color: #6b7280; font-style: italic; }
        
        .toc-link { text-decoration: none; display: block; transition: 0.2s; border-radius: 6px; }
        .toc-link:hover { background-color: ${accentColor}0D; padding-left: 5px; }

        /* Dark Mode Variables for Web Guide */
        body.dark-mode { background: #010409; color: #ffffff; }
        body.dark-mode .card { background: #0d1117; border-color: #30363d; }
        body.dark-mode .card-header { background: #161b22; border-color: #30363d; border-left-color: ${darkAccent}; }
        body.dark-mode .text-content { color: #c9d1d9; }
        body.dark-mode .title { color: #ffffff; }
        body.dark-mode .middle-title { color: #8b949e; }
        body.dark-mode .markdown-body pre { background: #010409; color: ${darkAccent}; border-color: #30363d; }
        body.dark-mode .toc-link div { color: #c9d1d9 !important; border-bottom-color: #30363d !important; }
        body.dark-mode .toc-link:hover { background-color: ${darkAccent}0D; }
        body.dark-mode .code-block-wrapper { border-color: #30363d; }
        body.dark-mode .code-block-header { background: rgba(0, 0, 0, 0.35); border-bottom-color: #30363d; }
        body.dark-mode .btn-copy-code { border-color: #30363d; color: #8b949e; }
        body.dark-mode .code-block-wrapper pre { background: #010409 !important; }

        /* Image Modal Styles */
        .img-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; justify-content: center; align-items: center; cursor: zoom-out; backdrop-filter: blur(5px); }
        .img-modal-content { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        
        /* Go to Top Button */
        .btn-top { position: fixed; bottom: 30px; right: 30px; width: 50px; height: 50px; background: ${accentColor}; color: #fff; border-radius: 50%; border: none; font-size: 20px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; opacity: 0; visibility: hidden; transition: 0.3s; z-index: 9999; }
        .btn-top.show { opacity: 1; visibility: visible; }
        .btn-top:hover { transform: translateY(-5px); filter: brightness(1.1); }


        /* Guide TOC Navigator */
        .page-layout { display: flex; align-items: flex-start; max-width: 1400px; margin: -20px auto 40px; padding: 0 20px; }
        .guide-toc { width: 240px; flex-shrink: 0; position: sticky; top: 20px; max-height: calc(100vh - 40px); overflow-y: auto; padding: 20px 14px; background: #ffffff; border-right: 1px solid #e5e7eb; border-radius: 12px 0 0 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .guide-toc::-webkit-scrollbar { width: 3px; } .guide-toc::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .guide-toc-header { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${accentColor}; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
        .guide-toc-chapter { font-size: 12px; font-weight: 700; color: ${accentColor}; margin-top: 14px; margin-bottom: 3px; padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .guide-toc-chapter:first-child { margin-top: 0; }
        .guide-toc-middle { font-size: 12px; font-weight: 600; color: #4b5563; padding: 3px 4px 3px 14px; border-radius: 4px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: 0.15s; text-decoration: none; display: block; }
        .guide-toc-middle:hover { color: ${accentColor}; background: ${accentColor}1A; }
        .guide-toc-item { font-size: 11.5px; color: #6b7280; padding: 3px 4px 3px 26px; border-radius: 4px; border-left: 2px solid transparent; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: 0.15s; text-decoration: none; display: block; margin-bottom: 1px; }
        .guide-toc-item:hover { color: ${accentColor}; background: ${accentColor}0D; }
        .guide-toc-item.active { color: ${accentColor}; border-left-color: ${accentColor}; font-weight: 600; background: ${accentColor}1A; }
        .container { flex: 1; min-width: 0; max-width: none; margin: 0; }
        /* Dark mode TOC */
        body.dark-mode .guide-toc { background: #0d1117; border-right-color: #30363d; }
        body.dark-mode .guide-toc-header { color: ${darkAccent}; border-bottom-color: #30363d; }
        body.dark-mode .guide-toc-chapter { color: ${darkAccent}; }
        body.dark-mode .guide-toc-middle { color: #8b949e; }
        body.dark-mode .guide-toc-middle:hover { color: ${darkAccent}; background: ${darkAccent}14; }
        body.dark-mode .guide-toc-item { color: #8b949e; }
        body.dark-mode .guide-toc-item:hover { background: ${darkAccent}0D; color: ${darkAccent}; }
        body.dark-mode .guide-toc-item.active { color: ${darkAccent}; border-left-color: ${darkAccent}; background: ${darkAccent}14; }

        /* Code Block Wrapper & Copy Button */
        .code-block-wrapper { margin: 10px 0; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb; border-left: 3px solid ${codeColor}; }
        .code-block-header { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.08); padding: 5px 12px; border-bottom: 1px solid #e5e7eb; }
        .code-lang-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${codeColor}; font-family: 'D2Coding', monospace; }
        .btn-copy-code { background: transparent; border: 1px solid #e5e7eb; color: #4b5563; font-size: 11px; padding: 3px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: background 0.15s, color 0.15s, border-color 0.15s; font-family: sans-serif; }
        .btn-copy-code:hover, .btn-copy-code.copied { color: ${codeColor}; border-color: ${codeColor}; background: ${codeColor}1A; }
        .code-block-wrapper pre { margin: 0 !important; padding: 14px 16px !important; background: #1e1e1e !important; border: none !important; overflow-x: auto; border-radius: 0 !important; }
        .code-block-wrapper pre code.hljs { padding: 0 !important; background: transparent !important; font-family: 'D2Coding', monospace !important; font-size: 13px !important; line-height: 1.6; }
    </style>
</head>
<body class="${bodyClass}">
    <!-- 이미지 모달 -->
    <div id="img-modal" class="img-modal-overlay" onclick="closeModal()">
        <img id="img-modal-content" class="img-modal-content" src="">
    </div>

    <script>
        function openModal(src) {
            document.getElementById('img-modal-content').src = src;
            document.getElementById('img-modal').style.display = 'flex';
        }
        function closeModal() {
            document.getElementById('img-modal').style.display = 'none';
        }
        // 위로 가기 버튼
        window.addEventListener('scroll', function() {
            const btn = document.getElementById('btn-top');
            if (!btn) return;
            btn.classList.toggle('show', window.scrollY > 300);
        });
        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

    <\/script>

    <button type="button" class="btn-top" id="btn-top" onclick="scrollToTop()">▲</button>


    <div class="header" style="position: relative;">
        <h1>${escapeHtml(projectName)}</h1>
        <p>${escapeHtml(guideSubtitle)}</p>
    </div>
    <div class="page-layout">
    <aside class="guide-toc" id="guide-toc">
        <div class="guide-toc-header">📋 Navigator</div>
        <!-- JS가 TOC 항목을 여기에 렌더링합니다 -->
    </aside>
    <div class="container">`;

            // HTML용 TOC 영역 렌더링
            if (tocLines.length > 0) {
                htmlContent += `
        <div class="card">
            <div class="card-header" style="border-left: 6px solid ${accentColor};">
                <h2 class="title">목차 (Table of Contents)</h2>
            </div>
            <div class="card-body" style="display: block;">
                <div class="toc-html-container">`;
                
                tocLines.forEach(line => {
                    if (line.type === 'chapter') {
                        htmlContent += `<div style="font-size: 18px; color: ${accentColor}; font-weight: bold; margin-top: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">${escapeHtml(line.text)}</div>`;
                    } else if (line.type === 'middle') {
                        let anchor = line.slideIndex !== undefined ? `slide-${line.slideIndex}` : `slide-cover-${line.renderableIndex}`;
                        let pageNum = 1 + tocPages + line.renderableIndex + 1;
                        htmlContent += `<a href="#${anchor}" class="toc-link" style="padding-left:0px; display:block; text-decoration:none;">
                            <div style="font-size: 16px; color: #4b5563; font-weight: bold; padding-left: 20px; display: flex; justify-content: space-between; margin-top: 10px;">
                                <span>${escapeHtml(line.text)}</span>
                                <span style="color: ${accentColor}; font-weight: bold; font-size:14px;">Page ${pageNum}</span>
                            </div>
                        </a>`;
                    } else if (line.type === 'title') {
                        let pageNum = 1 + tocPages + line.renderableIndex + 1;
                        htmlContent += `<a href="#slide-${line.slideIndex}" class="toc-link">
                            <div style="font-size: 15px; color: #1f2937; padding-left: 40px; display: flex; justify-content: space-between; margin-top: 8px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 4px; padding-right: 10px;">
                                <span>${escapeHtml(line.text)}</span>
                                <span style="color: ${accentColor}; font-weight: bold;">Page ${pageNum}</span>
                            </div>
                        </a>`;
                    }
                });

                htmlContent += `
                </div>
            </div>
        </div>`;
            }

            // 본문 내용 렌더링
            let prevChHTML = null;
            let prevMidHTML = null;
            let rIndex = 0;
            sourceSlides.forEach((slide, index) => {
                let ch = slide.chapter || '대제목 미지정';
                let mid = slide.middleTitle || '';
                
                if (ch !== prevChHTML) {
                    prevChHTML = ch;
                    prevMidHTML = null;
                }
                
                if (mid && mid !== prevMidHTML) {
                    htmlContent += `
        <div class="card" id="slide-cover-${rIndex}" style="background: #111827; border-color: #30363d;">
            <div class="card-body" style="min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <div style="font-size: 20px; color: ${darkAccent}; font-weight: bold; margin-bottom: 25px;">${escapeHtml(ch)}</div>
                <div style="font-size: 48px; color: #ffffff; font-weight: bold; line-height: 1.3; letter-spacing: -0.5px;">${escapeHtml(mid)}</div>
            </div>
        </div>`;
                    rIndex++; // 가상 표지가 1페이지 차지
                    prevMidHTML = mid;
                }

                const parsedMarkdownText = marked.parse(slide.text || '');
                
                const hasText = slide.text && slide.text.trim() !== '';
                const hasImage = !!slide.image;

                let currentRatio = slide.textRatio || 50;
                let txtFlex = (hasImage && hasText) ? currentRatio : 100;
                let imgFlex = (hasImage && hasText) ? (100 - currentRatio) : 100;

                let textContentHtml = '';
                if (hasText) {
                    textContentHtml = `
                        <div class="text-content" style="flex: ${txtFlex};">
                            <div class="markdown-body">${parsedMarkdownText}</div>
                        </div>
                    `;
                }

                let imgContentHtml = '';
                if (hasImage) {
                    const imageSrc = getSlideImageSrc(slide.image);
                    let captionHtml = slide.imageCaption ? `<div style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 8px; width: 100%; word-break: break-all;">${escapeHtml(slide.imageCaption)}</div>` : '';
                    imgContentHtml = `<div class="img-content" style="flex: ${imgFlex}; flex-direction: column; align-items: center;"><img src="${imageSrc}" alt="Slide ${index + 1} Image" onclick="openModal(this.src)" title="클릭하여 원본 보기">${captionHtml}</div>`;
                }

                const middleTitleHtml = slide.middleTitle 
                    ? `<div class="middle-title">${escapeHtml(slide.middleTitle)}</div>` 
                    : '';

                htmlContent += `
        <div class="card" id="slide-${index}">
            <div class="card-header">
                <div class="chapter">${escapeHtml(slide.chapter)}</div>
                ${middleTitleHtml}
                <h2 class="title">${escapeHtml(slide.title)}</h2>
            </div>
            <div class="card-body">
                ${textContentHtml}
                ${imgContentHtml}
            </div>
        </div>`;
                rIndex++;
            });

            htmlContent += `
    </div>
    </div>
    <div class="footer">
        &copy; ${new Date().getFullYear()} ${escapeHtml(footerCopy)} Generated
    </div>
    <script>
        // 복사 버튼 핸들러
        function copyCode(btn) {
            var code = btn.closest('.code-block-wrapper').querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(function() {
                btn.innerHTML = '\u2713 복사됨!';
                btn.classList.add('copied');
                setTimeout(function() { btn.innerHTML = '복사'; btn.classList.remove('copied'); }, 2000);
            });
        }
        // 위로 가기 및 테마 버튼 스크롤 핸들러
        window.addEventListener('scroll', function() {
            document.getElementById('btn-top') && (document.getElementById('btn-top').classList.toggle('show', window.scrollY > 300));
        });
        // TOC 사이드바 생성
        (function buildToc() {
            var toc = document.getElementById('guide-toc');
            if (!toc) return;
            var slides = document.querySelectorAll('.card[id^="slide-"]');
            if (!slides.length) return;
            var html = '<div class="guide-toc-header">📋 Navigator</div>';
            var prevCh = null, prevMid = null, seenKey = {};
            slides.forEach(function(card) {
                var idx    = card.id.replace('slide-', '');
                var chEl   = card.querySelector('.chapter');
                var midEl  = card.querySelector('.middle-title');
                var titEl  = card.querySelector('.title');
                var ch  = chEl  ? chEl.textContent.trim()  : '';
                var mid = midEl ? midEl.textContent.trim() : '';
                var tit = titEl ? titEl.textContent.trim() : '';
                if (ch && ch !== prevCh) {
                    html += '<div class="guide-toc-chapter" title="' + ch + '">' + ch + '</div>';
                    prevCh = ch; prevMid = null;
                }
                if (mid && mid !== prevMid) {
                    html += '<a class="guide-toc-middle" href="#slide-' + idx + '" title="' + mid + '">' + mid + '</a>';
                    prevMid = mid;
                }
                var key = ch + '||' + mid + '||' + tit;
                if (!seenKey[key]) {
                    seenKey[key] = idx;
                    html += '<a class="guide-toc-item" data-slide="' + idx + '" href="#slide-' + idx + '" title="' + tit + '">' + tit + '</a>';
                }
            });
            toc.innerHTML = html;
            // IntersectionObserver 스크롤 연동
            var items = toc.querySelectorAll('.guide-toc-item[data-slide]');
            var seenFirst = {};
            slides.forEach(function(card) {
                var idx    = card.id.replace('slide-', '');
                var chEl   = card.querySelector('.chapter');
                var midEl  = card.querySelector('.middle-title');
                var titEl  = card.querySelector('.title');
                var key = (chEl?chEl.textContent.trim():'') + '||' + (midEl?midEl.textContent.trim():'') + '||' + (titEl?titEl.textContent.trim():'');
                if (!seenFirst[key]) seenFirst[key] = idx;
            });
            var ob = new IntersectionObserver(function(entries) {
                entries.forEach(function(e) {
                    if (!e.isIntersecting) return;
                    var card = e.target;
                    var chEl   = card.querySelector('.chapter');
                    var midEl  = card.querySelector('.middle-title');
                    var titEl  = card.querySelector('.title');
                    var key = (chEl?chEl.textContent.trim():'') + '||' + (midEl?midEl.textContent.trim():'') + '||' + (titEl?titEl.textContent.trim():'');
                    items.forEach(function(t) { t.classList.remove('active'); });
                    var firstIdx = seenFirst[key];
                    if (firstIdx !== undefined) {
                        var active = toc.querySelector('.guide-toc-item[data-slide="' + firstIdx + '"]');
                        if (active) active.classList.add('active');
                    }
                });
            }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
            slides.forEach(function(el) { ob.observe(el); });
        })();
    <\/script>
</body>
</html>`;


            return htmlContent;
        }

        // 웹 가이드 서버 배포 및 새 탭 창 열기
        window.viewWebGuide = async function() {
            if (slidesData.length === 0) {
                showModal('배포할 슬라이드 내용을 하나 이상 작성해주세요.');
                return;
            }
            
            const btn = document.getElementById('dl-html-view-btn');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중...';
            
            const htmlContent = generateHTMLContent();

            try {
                const response = await fetch('/api/saveHtml', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/html' },
                    body: htmlContent
                });
                
                if (response.ok) {
                    window.open('/exports/SlideEditor_Web_Guide.html?t=' + new Date().getTime(), '_blank');
                } else {
                    console.warn('서버 저장 실패. 로컬 다운로드 전환');
                    window.exportToHTML();
                }
            } catch (err) {
                console.warn('통신 오류. 로컬 다운로드 전환:', err);
                window.exportToHTML();
            } finally {
                btn.innerHTML = '<i class="fa-solid fa-book-open"></i> 가이드 보기';
            }
        };

        // 수동 웹 가이드 다운로드
        window.exportToHTML = async function() {
            if (slidesData.length === 0) {
                showModal('다운로드할 슬라이드가 없습니다!');
                return;
            }

            const btn = document.getElementById('dl-html-btn');
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중...';
                btn.disabled = true;
            }

            try {
                const portableSlides = await buildPortableSlides(slidesData);
                const htmlContent = generateHTMLContent(portableSlides);
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'SlideEditor_Web_Guide.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error('HTML 다운로드용 이미지 변환 중 오류:', err);
                showModal('HTML 다운로드용 이미지를 준비하는 중 오류가 발생했습니다.\n' + err.message);
            } finally {
                if (btn) {
                    btn.innerHTML = '<i class="fa-solid fa-file-code"></i> HTML';
                    btn.disabled = false;
                }
            }
        };

        // 데이터(JSON) 파일 저장
        function sanitizeDownloadName(name) {
            return String(name || 'My Guide')
                .trim()
                .replace(/[\\/:*?"<>|]/g, '_')
                .replace(/\s+/g, ' ')
                || 'My Guide';
        }

        function buildBackupTimestamp() {
            const now = new Date();
            const year = now.getFullYear().toString().slice(-2);
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            return `${year}${month}${day}${hours}${minutes}${seconds}`;
        }

        function buildBackupFileName(projectName) {
            return `${sanitizeDownloadName(projectName)}_data_${buildBackupTimestamp()}.json`;
        }

        function getImportProjectName(importedData, fallbackName) {
            if (importedData && typeof importedData === 'object' && !Array.isArray(importedData)) {
                return normalizeProjectName(importedData.settings?.branding?.projectName, fallbackName);
            }
            return normalizeProjectName(fallbackName, 'Imported Project');
        }

        window.exportData = async function() {
            if (!currentProject?.id) {
                showModal('저장할 프로젝트가 없습니다.');
                return;
            }

            collectBrandingFromUI();
            const dataStr = JSON.stringify(buildProjectDataDocument(), null, 2);

            try {
                const payload = await requestJson(`/api/projects/${encodeURIComponent(currentProject.id)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: dataStr
                });

                currentProject = Object.assign({}, currentProject, {
                    savedVersion: normalizeSavedVersion(payload?.project?.savedVersion) || getCurrentSavedVersion()
                });
                updateProjectIndicator();
                showModal(`현재 프로젝트를 저장했습니다: ${currentProject.name}`);
                await refreshProjectList();
                return;
            } catch (err) {
                console.warn('프로젝트 저장 실패, JSON 백업 다운로드로 전환합니다.', err);
            }
            
            // 날짜 데이터 포맷 생성 (_YYMMDDhhmmss)
            const now = new Date();
            const year = now.getFullYear().toString().slice(-2);
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
            
            let fallbackDataStr = dataStr;
            try {
                const portableSlides = await buildPortableSlides(slidesData);
                fallbackDataStr = JSON.stringify(buildProjectDataDocument(portableSlides), null, 2);
            } catch (portableErr) {
                console.warn('이식형 백업 생성 실패, 현재 메모리 데이터를 그대로 다운로드합니다.', portableErr);
            }

            const blob = new Blob([fallbackDataStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = buildBackupFileName(currentProject?.name || projectSettings?.branding?.projectName || 'My Guide');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showModal('웹 서버 연동을 실패하여 브라우저 다운로드 방식을 통해 백업본으로 저장(다운로드)했습니다.');
        };

        // 수동 데이터(JSON) 파일 다운로드 (PC 로컬)
        window.downloadData = async function() {
            if (slidesData.length === 0) {
                showModal('다운로드할 슬라이드 데이터가 없습니다.');
                return;
            }

            collectBrandingFromUI();
            let portableSlides;
            try {
                portableSlides = await buildPortableSlides(slidesData);
            } catch (err) {
                console.error('이미지 포함 백업 생성 중 오류:', err);
                showModal('이미지 데이터를 백업 파일로 변환하는 중 오류가 발생했습니다.\n' + err.message);
                return;
            }

            const dataStr = JSON.stringify(buildProjectDataDocument(portableSlides), null, 2);
            
            const now = new Date();
            const year = now.getFullYear().toString().slice(-2);
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
            
            const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = buildBackupFileName(currentProject?.name || projectSettings?.branding?.projectName || 'My Guide');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // 맨 위로가기 로직
        window.onscroll = function() {
            const btn = document.getElementById('btn-top-editor');
            if (!btn) return;
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        };

        window.scrollToTop = function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // 데이터(JSON) 파일 수동 불러오기 (구버전/신버전 모두 지원)
        window.importData = async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    if (typeof window.cancelLegacyImageBackfill === 'function') {
                        window.cancelLegacyImageBackfill();
                    }

                    const importedData = JSON.parse(e.target.result);

                    if (!Array.isArray(importedData) && !(importedData && Array.isArray(importedData.slides))) {
                        showModal('올바른 데이터 형식이 아닙니다.\n지원 형식: 슬라이드 배열([]) 또는 {settings, slides} 객체');
                        return;
                    }

                    const fallbackImportName = file.name.replace(/\.[^.]+$/, '') || 'Imported Project';
                    const importProjectName = getImportProjectName(importedData, fallbackImportName);
                    const importPayload = Array.isArray(importedData)
                        ? buildProjectDataDocument(migrateData(importedData), getDefaultProjectSettings(importProjectName), importProjectName)
                        : buildProjectDataDocument(migrateData(importedData.slides), importedData.settings, importProjectName);

                    const created = await requestJson('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(Object.assign({ name: importProjectName }, importPayload))
                    });

                    await loadProjectById(created.id);
                    if (typeof window.closeProjectModal === 'function') {
                        window.closeProjectModal();
                    }
                    showModal(`데이터를 프로젝트로 가져왔습니다: ${created.name}`);
                } catch (err) {
                    console.error('데이터 파일 불러오기 오류:', err);
                    showModal('데이터 파일을 읽는 중 오류가 발생했습니다.\n' + err.message);
                }
                event.target.value = '';
            };
            reader.readAsText(file);
        };

        // ===========================
        // 테마 엔진
        // ===========================

        // 기본 테마 오브젝트 (서버 연동 실패 시 폴백)
