import codecs
import re
import os

target_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'HPE_VME_Editor.html')

with codecs.open(target_file, 'r', 'utf-8') as f:
    text = f.read()

# 1. generateTocData
target1 = '''        // TOC(목차) 데이터를 추출하는 함수
        function generateTocData(slides) {
            let lines = [];
            let prevCh = null;
            let prevMid = null;
            let prevTit = null;

            slides.forEach((s, i) => {
                let ch = s.chapter || '대제목 미지정';
                let mid = s.middleTitle || '';
                let tit = s.title || '소제목 없음';

                // 대제목, 중제목, 소제목이 모두 직전 슬라이드와 동일하면 목차에 추가하지 않고 건너뜀
                if (ch === prevCh && mid === prevMid && tit === prevTit) {
                    return;
                }

                if (ch !== prevCh) {
                    lines.push({ type: 'chapter', text: ch });
                    prevCh = ch;
                    prevMid = null; // 대제목이 바뀌면 중제목 초기화
                }
                if (mid && mid !== prevMid) {
                    lines.push({ type: 'middle', text: mid });
                    prevMid = mid;
                }
                
                lines.push({ type: 'title', text: tit, slideIndex: i });
                prevTit = tit;
            });
            return lines;
        }'''
replacement1 = '''        // TOC(목차) 데이터를 추출하는 함수
        function generateTocData(slides) {
            let lines = [];
            let prevCh = null;
            let prevMid = null;
            let prevTit = null;
            let rIndex = 0;

            slides.forEach((s, i) => {
                let ch = s.chapter || '대제목 미지정';
                let mid = s.middleTitle || '';
                let tit = s.title || '소제목 없음';

                if (ch === prevCh && mid === prevMid && tit === prevTit) {
                    return;
                }

                if (ch !== prevCh) {
                    lines.push({ type: 'chapter', text: ch });
                    prevCh = ch;
                    prevMid = null; // 대제목이 바뀌면 중제목 초기화
                }
                if (mid && mid !== prevMid) {
                    lines.push({ type: 'middle', text: mid, renderableIndex: rIndex });
                    rIndex++;
                    prevMid = mid;
                }
                
                lines.push({ type: 'title', text: tit, slideIndex: i, renderableIndex: rIndex });
                rIndex++;
                prevTit = tit;
            });
            return lines;
        }'''
text = text.replace(target1.replace('\r\n', '\n'), replacement1)

# 2. Preview TOC Link
target2 = '''                    } else if (line.type === 'middle') {
                        tocHtml += `<div class="toc-middle">${escapeHtml(line.text)}</div>`;
                    } else if (line.type === 'title') {
                        // 표지(1) + TOC 페이지들 + 해당 슬라이드 인덱스 + 1
                        let pageNum = 1 + tocPages + line.slideIndex + 1; 
                        tocHtml += `<div class="toc-title" onclick="document.getElementById('preview-slide-${line.slideIndex}').scrollIntoView({behavior: 'smooth', block: 'start'})">
                            <span>${escapeHtml(line.text)}</span> 
                            <span class="toc-page">Page ${pageNum}</span>
                        </div>`;
                    }'''
replacement2 = '''                    } else if (line.type === 'middle') {
                        let anchor = line.slideIndex !== undefined ? `preview-slide-${line.slideIndex}` : `preview-cover-${line.renderableIndex}`;
                        let pageNum = 1 + tocPages + line.renderableIndex + 1; 
                        tocHtml += `<div class="toc-middle" onclick="document.getElementById('${anchor}').scrollIntoView({behavior: 'smooth', block: 'start'})" style="cursor:pointer;" title="Page ${pageNum}">${escapeHtml(line.text)}</div>`;
                    } else if (line.type === 'title') {
                        let pageNum = 1 + tocPages + line.renderableIndex + 1; 
                        tocHtml += `<div class="toc-title" onclick="document.getElementById('preview-slide-${line.slideIndex}').scrollIntoView({behavior: 'smooth', block: 'start'})">
                            <span>${escapeHtml(line.text)}</span> 
                            <span class="toc-page">Page ${pageNum}</span>
                        </div>`;
                    }'''
text = text.replace(target2.replace('\r\n', '\n'), replacement2)

# 3. renderPreview Loop
target3 = '''            // 3. 본문 슬라이드 루프
            for (let i = 0; i <= slidesData.length; i++) {
                
                // [1] '새 슬라이드 추가' 폼 또는 구분선'''
replacement3 = '''            // 3. 본문 슬라이드 루프
            let rIndex = 0;
            let prevCh = null;
            let prevMid = null;
            for (let i = 0; i <= slidesData.length; i++) {
                
                // [1] '새 슬라이드 추가' 폼 또는 구분선'''
text = text.replace(target3.replace('\r\n', '\n'), replacement3)

target4 = '''                // [2] 기존 슬라이드 프리뷰 또는 '수정' 폼
                if (i < slidesData.length) {
                    const slide = slidesData[i];
                    
                    if (editingSlideIndex === i) {'''
replacement4 = '''                // [2] 기존 슬라이드 프리뷰 또는 '수정' 폼
                if (i < slidesData.length) {
                    const slide = slidesData[i];
                    
                    let ch = slide.chapter || '대제목 미지정';
                    let mid = slide.middleTitle || '';
                    if (ch !== prevCh) { prevCh = ch; prevMid = null; }
                    if (mid && mid !== prevMid) {
                        const coverDiv = document.createElement('div');
                        coverDiv.className = 'slide-preview cover-preview middle-cover';
                        coverDiv.id = `preview-cover-${rIndex}`;
                        coverDiv.style.background = '#111827';
                        coverDiv.style.borderLeft = '6px solid var(--hpe-green)';
                        coverDiv.innerHTML = `
                            <div style="font-size: 20px; color: var(--hpe-green); font-weight: bold; margin-bottom: 25px;">${escapeHtml(ch)}</div>
                            <div style="font-size: 48px; color: #fff; line-height: 1.3; font-weight: bold; letter-spacing: -0.5px;">${escapeHtml(mid)}</div>
                        `;
                        area.appendChild(coverDiv);
                        rIndex++;
                        prevMid = mid;
                    }
                    
                    if (editingSlideIndex === i) {'''
text = text.replace(target4.replace('\r\n', '\n'), replacement4)

target5 = '''                        // ==== 일반 프리뷰 모드 ====
                        const contentPageNumber = 1 + tocPages + i + 1; // 표지(1) + TOC페이지들 + 인덱스 + 1'''
replacement5 = '''                        // ==== 일반 프리뷰 모드 ====
                        const contentPageNumber = 1 + tocPages + rIndex + 1; // 표지(1) + TOC페이지들 + 실 페이지 수 + 1'''
text = text.replace(target5.replace('\r\n', '\n'), replacement5)

target6 = '''                        area.appendChild(slideDiv);
                    }
                }
            }'''
replacement6 = '''                        area.appendChild(slideDiv);
                    }
                    rIndex++;
                }
            }'''
text = text.replace(target6.replace('\r\n', '\n'), replacement6)

# 4. PPTX Export
target7 = '''                    } else if (line.type === 'title') {
                        let pageNum = 1 + tocPages + line.slideIndex + 1;'''
replacement7 = '''                    } else if (line.type === 'title') {
                        let pageNum = 1 + tocPages + line.renderableIndex + 1;'''
text = text.replace(target7.replace('\r\n', '\n'), replacement7)

target8 = '''            // 3. 본문 슬라이드 생성
            slidesData.forEach(data => {
                let slide = pptx.addSlide({ masterName: 'VME_MASTER' });'''
replacement8 = '''            // 3. 본문 슬라이드 생성
            let prevChPPTX = null;
            let prevMidPPTX = null;
            slidesData.forEach(data => {
                let ch = data.chapter || '대제목 미지정';
                let mid = data.middleTitle || '';
                
                if (ch !== prevChPPTX) { prevChPPTX = ch; prevMidPPTX = null; }
                if (mid && mid !== prevMidPPTX) {
                    let coverSlide = pptx.addSlide({ masterName: 'VME_MASTER' });
                    coverSlide.background = { color: '111827' };
                    coverSlide.addText(ch, { x: 0.5, y: 2.2, w: 9, h: 0.5, fontSize: 24, color: '00E676', bold: true, align: 'center', fontFace: 'Malgun Gothic' });
                    coverSlide.addText(mid, { x: 0.5, y: 2.8, w: 9, h: 1.0, fontSize: 44, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Arial' });
                    prevMidPPTX = mid;
                }
                let slide = pptx.addSlide({ masterName: 'VME_MASTER' });'''
text = text.replace(target8.replace('\r\n', '\n'), replacement8)

# 5. HTML Export
target9 = '''                    } else if (line.type === 'title') {
                        let pageNum = 1 + tocPages + line.slideIndex + 1;
                        htmlContent += `<a href="#slide-${line.slideIndex}" class="toc-link">'''
replacement9 = '''                    } else if (line.type === 'title') {
                        let pageNum = 1 + tocPages + line.renderableIndex + 1;
                        htmlContent += `<a href="#slide-${line.slideIndex}" class="toc-link">'''
text = text.replace(target9.replace('\r\n', '\n'), replacement9)

# We also need to add anchor for middle title in HTML export!
# Let's fix the middle loop in generateHTMLContent:
target_html_middle = '''                    } else if (line.type === 'middle') {
                        htmlContent += `<div style="font-size: 16px; color: #4b5563; font-weight: bold; padding-left: 20px; margin-top: 10px;">${escapeHtml(line.text)}</div>`;
                    } else if'''
replacement_html_middle = '''                    } else if (line.type === 'middle') {
                        let anchor = line.slideIndex !== undefined ? `slide-${line.slideIndex}` : `slide-cover-${line.renderableIndex}`;
                        let pageNum = 1 + tocPages + line.renderableIndex + 1;
                        htmlContent += `<a href="#${anchor}" class="toc-link" style="padding-left:0px; display:block; text-decoration:none;">
                            <div style="font-size: 16px; color: #4b5563; font-weight: bold; padding-left: 20px; display: flex; justify-content: space-between; margin-top: 10px;">
                                <span>${escapeHtml(line.text)}</span>
                                <span style="color: #01a982; font-weight: bold; font-size:14px;">Page ${pageNum}</span>
                            </div>
                        </a>`;
                    } else if'''
text = text.replace(target_html_middle.replace('\r\n', '\n'), replacement_html_middle)

target10 = '''            // 본문 내용 렌더링
            slidesData.forEach((slide, index) => {
                const parsedMarkdownText = marked.parse(slide.text || '');'''
replacement10 = '''            // 본문 내용 렌더링
            let prevChHTML = null;
            let prevMidHTML = null;
            let rIndex = 0;
            slidesData.forEach((slide, index) => {
                let ch = slide.chapter || '대제목 미지정';
                let mid = slide.middleTitle || '';
                
                if (ch !== prevChHTML) { prevChHTML = ch; prevMidHTML = null; }
                if (mid && mid !== prevMidHTML) {
                    htmlContent += `
        <div class="card" id="slide-cover-${rIndex}" style="background: #111827; border-color: #30363d;">
            <div class="card-body" style="min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <div style="font-size: 20px; color: #00e676; font-weight: bold; margin-bottom: 25px;">${escapeHtml(ch)}</div>
                <div style="font-size: 48px; color: #ffffff; font-weight: bold; line-height: 1.3; letter-spacing: -0.5px;">${escapeHtml(mid)}</div>
            </div>
        </div>`;
                    rIndex++;
                    prevMidHTML = mid;
                }
                
                const parsedMarkdownText = marked.parse(slide.text || '');'''
text = text.replace(target10.replace('\r\n', '\n'), replacement10)

target11 = '''        </div>`;
            });

            htmlContent += `
    </div>'''
replacement11 = '''        </div>`;
                rIndex++;
            });

            htmlContent += `
    </div>'''
text = text.replace(target11.replace('\r\n', '\n'), replacement11)

with codecs.open(target_file, 'w', 'utf-8') as f:
    f.write(text)
print('Done!')
