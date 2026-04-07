// === SAVE DATA START ===
        let slidesData = [];
        // === SAVE DATA END ===

        // === SETTINGS: 브랜딩은 데이터파일에, 테마명은 activeTheme.name으로 관리 ===
        let projectSettings = {
            activeTheme: 'hpe_default',
            branding: {
                projectName:   'My Guide',
                guideSubtitle: '가이드 부제',
                footerCopy:    'My Guide'
            }
        };

        // 현재 로드된 테마 객체
        let activeTheme = null;

        // 초기 로드 시 기존 데이터가 있으면 에디터 폼을 숨기고, 데이터가 없으면 첫 번째 에디터를 엽니다.
        let activeEditorIndex = null;
        let editingSlideIndex = null;

        // ===========================
        // highlight.js + marked.js 연동 렌더러 설정
        // ===========================
        (function setupMarkedRenderer() {
            const renderer = new marked.Renderer();
            renderer.code = function({ text, lang }) {
                const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
                const highlighted = hljs.highlight(text, { language: validLang }).value;
                return `<div class="code-block-wrapper">
                    <div class="code-block-header">
                        <span class="code-lang-label">${validLang}</span>
                        <button class="btn-copy-code" onclick="window.copyCode(this)" title="코드 복사">
                            <i class="fa-regular fa-copy"></i> 복사
                        </button>
                    </div>
                    <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
                </div>`;
            };
            marked.use({ renderer });
        })();

        // 코드 블록 원클릭 복사 함수
        window.copyCode = function(btn) {
            const code = btn.closest('.code-block-wrapper').querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> 복사됨!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-regular fa-copy"></i> 복사';
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(() => {
                // clipboard API 미지원 시 fallback
                const ta = document.createElement('textarea');
                ta.value = code;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                btn.innerHTML = '<i class="fa-solid fa-check"></i> 복사됨!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-regular fa-copy"></i> 복사';
                    btn.classList.remove('copied');
                }, 2000);
            });
        };

        // 구버전(bashCode 필드 포함) 데이터를 새 마크다운 구조로 마이그레이션하는 함수 (안정성 강화)
        function migrateData(slides) {
            return slides.map(slide => {
                if (!slide) return slide;
                
                if (slide.bashCode) {
                    let code = slide.bashCode;
                    let text = slide.text || '';
                    
                    if (typeof text === 'string' && text.trim() !== '') {
                        text += '\n\n';
                    } else if (typeof text !== 'string') {
                        text = String(text || '');
                        if (text.trim() !== '') text += '\n\n';
                    }
                    
                    text += '```bash\n' + code + '\n```';
                    slide.text = text;
                    delete slide.bashCode;
                }
                
                if (slide.textRatio === undefined) {
                    slide.textRatio = 50;
                }
                return slide;
            });
        }

        // ===========================
        // 데이터 로드 호환 파서
        // - 구버전: 슬라이드 배열([])          → 자동 마이그레이션
        // - 신버전: { settings, slides } 래퍼  → 정상 파싱
        // ===========================
        function parseLoadedData(data) {
            if (Array.isArray(data)) {
                // ── 구버전 호환: 순수 배열이면 기본 settings 유지, 슬라이드만 교체
                console.log('[호환] 구버전 데이터(배열) 감지 → 기본 settings 유지');
                slidesData = migrateData(data);
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.slides)) {
                    // ── 신버전 래퍼 구조
                    slidesData = migrateData(data.slides);
                    if (data.settings) {
                        // Deep merge: 빠진 키는 기본값 유지
                        projectSettings = {
                            activeTheme: data.settings.activeTheme || projectSettings.activeTheme,
                            branding: Object.assign({}, projectSettings.branding, data.settings.branding || {})
                        };
                    }
                } else {
                    console.warn('[호환] 알 수 없는 데이터 구조 → 무시');
                }
            }
        }

        // 같은 폴더에 있는 slide_data.json 파일을 자동으로 불러오는 함수
        async function loadInitialData() {
            try {
                const response = await fetch('./data/slide_data.json');
                if (response.ok) {
                    const data = await response.json();
                    parseLoadedData(data);
                }
            } catch (e) {
                console.log('초기 데이터 파일(slide_data.json)이 없거나 로컬 파일 시스템 제약(CORS)으로 불러올 수 없습니다. 수동으로 불러오기를 사용해주세요.', e);
            } finally {
                // 저장된 테마 자동 로드
                await loadThemeByName(projectSettings.activeTheme);
                activeEditorIndex = slidesData.length === 0 ? 0 : null;
                window.renderPreview();
            }
        }

        // 초기 화면 렌더링 실행 (자동 불러오기 포함)
        window.onload = loadInitialData;

        // 이미지 확대 모달 제어 함수
        window.openImageModal = function(src) {
            const modal = document.getElementById('image-modal');
            const img = document.getElementById('image-modal-content');
            img.src = src;
            modal.style.display = 'flex';
        };

        window.closeImageModal = function() {
            const modal = document.getElementById('image-modal');
            modal.style.display = 'none';
        };

        // 이스케이프 함수 (HTML 태그 깨짐 방지 - 마크다운 렌더링 전에는 사용하지 않고 xss 필터링 용도로 필요 시 사용)
        function escapeHtml(str) {
            if (!str) return "";
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        // 커스텀 모달 제어 함수
        function showModal(message, isConfirm = false, onConfirm = null) {
            const modal = document.getElementById('custom-modal');
            const msgEl = document.getElementById('modal-message');
            const btnConfirm = document.getElementById('modal-btn-confirm');
            const btnCancel = document.getElementById('modal-btn-cancel');

            msgEl.innerText = message;
            
            if (isConfirm) {
                btnCancel.style.display = 'inline-block';
                btnConfirm.innerText = '삭제';
                btnConfirm.onclick = function() {
                    if(onConfirm) onConfirm();
                    modal.style.display = 'none';
                };
            } else {
                btnCancel.style.display = 'none';
                btnConfirm.innerText = '확인';
                btnConfirm.onclick = function() {
                    modal.style.display = 'none';
                };
            }
            
            btnCancel.onclick = function() {
                modal.style.display = 'none';
            };

            modal.style.display = 'flex';
        }

        // TOC(목차) 데이터를 추출하는 함수
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
        }

        // TOC 데이터를 페이지별로 분할하는 함수 (대제목 기준 및 최대 라인 수 기준)
        function paginateTocData(tocLines) {
            const LINES_PER_TOC_SLIDE = 15;
            let pages = [];
            let currentPage = [];
            let currentLineCount = 0;
            
            for (let i = 0; i < tocLines.length; i++) {
                let line = tocLines[i];
                
                // 대제목이 나타났는데, 현재 페이지가 이미 뭔가 채워져 있다면 분리
                if ((line.type === 'chapter' && currentPage.length > 0) || currentLineCount >= LINES_PER_TOC_SLIDE) {
                    pages.push(currentPage);
                    currentPage = [];
                    currentLineCount = 0;
                }
                
                currentPage.push(line);
                currentLineCount++;
            }
            if (currentPage.length > 0) {
                pages.push(currentPage);
            }
            return pages;
        }

        // -------------------------
        // 슬라이드 '추가' 관련 로직
        // -------------------------
        window.openEditor = function(index) {
            activeEditorIndex = index;
            editingSlideIndex = null; // 수정 모드 닫기
            window.renderPreview();
        };

        window.cancelEditor = function() {
            activeEditorIndex = null;
            window.renderPreview();
        };

        window.insertNewSlide = function(insertIndex) {
            const chapter = document.getElementById('input-chapter').value.trim() || '대제목 미지정';
            const middleTitle = document.getElementById('input-middle-title').value.trim();
            const title = document.getElementById('input-title').value.trim() || '소제목 없음';
            const text = document.getElementById('input-text').value.trim();
            const imageInput = document.getElementById('input-image');
            const imageCaption = document.getElementById('input-image-caption').value.trim();
            const textRatioInput = document.getElementById('input-text-ratio');
            const textRatio = textRatioInput ? parseInt(textRatioInput.value, 10) : 50;

            if (imageInput.files && imageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    slidesData.splice(insertIndex, 0, { chapter, middleTitle, title, text, imageCaption, image: e.target.result, textRatio });
                    activeEditorIndex = null;
                    window.renderPreview();
                };
                reader.readAsDataURL(imageInput.files[0]);
            } else {
                slidesData.splice(insertIndex, 0, { chapter, middleTitle, title, text, imageCaption, image: null, textRatio });
                activeEditorIndex = null;
                window.renderPreview();
            }
        };

        // -------------------------
        // 슬라이드 '수정' 관련 로직
        // -------------------------
        window.openEditSlide = function(index) {
            editingSlideIndex = index;
            activeEditorIndex = null; // 새 슬라이드 폼 닫기
            window.renderPreview();
        };

        window.cancelEditSlide = function() {
            editingSlideIndex = null;
            window.renderPreview();
        };

        window.saveEditSlide = function(index) {
            const chapter = document.getElementById('edit-chapter').value.trim() || '대제목 미지정';
            const middleTitle = document.getElementById('edit-middle-title').value.trim();
            const title = document.getElementById('edit-title').value.trim() || '소제목 없음';
            const text = document.getElementById('edit-text').value.trim();
            const imageInput = document.getElementById('edit-image');
            const imageCaption = document.getElementById('edit-image-caption').value.trim();
            const deleteImageChecked = document.getElementById('edit-delete-image')?.checked;
            const textRatioInput = document.getElementById('edit-text-ratio');
            const textRatio = textRatioInput ? parseInt(textRatioInput.value, 10) : 50;

            if (imageInput.files && imageInput.files[0]) {
                // 새 이미지 업로드 시
                const reader = new FileReader();
                reader.onload = function(e) {
                    slidesData[index] = { chapter, middleTitle, title, text, imageCaption, image: e.target.result, textRatio };
                    editingSlideIndex = null;
                    window.renderPreview();
                };
                reader.readAsDataURL(imageInput.files[0]);
            } else {
                // 이미지 업로드 안 한 경우 (기존 이미지 유지 혹은 삭제)
                const existingImage = deleteImageChecked ? null : slidesData[index].image;
                slidesData[index] = { chapter, middleTitle, title, text, imageCaption, image: existingImage, textRatio };
                editingSlideIndex = null;
                window.renderPreview();
            }
        };

        // -------------------------
        // 슬라이드 '삭제' 관련 로직
        // -------------------------
        window.deleteSlide = function(index) {
            showModal('이 슬라이드를 삭제하시겠습니까?', true, function() {
                slidesData.splice(index, 1);
                activeEditorIndex = null;
                editingSlideIndex = null;
                window.renderPreview();
            });
        };

        // -------------------------
        // 렌더링
        // -------------------------
        window.renderPreview = function() {
            const area = document.getElementById('preview-area');
            const status = document.getElementById('status-text');
            
            area.innerHTML = '';

            // TOC 라인 및 페이지 수 계산
            const tocLines = generateTocData(slidesData);
            const tocPagesData = slidesData.length > 0 ? paginateTocData(tocLines) : [];
            const tocPages = tocPagesData.length;

            // 1. 표지 고정 노출
            const coverDiv = document.createElement('div');
            coverDiv.className = 'slide-preview cover-preview';
            coverDiv.innerHTML = `
                <h1>${escapeHtml(projectSettings.branding.projectName || 'My Guide')}</h1>
                <p class="sub">${escapeHtml(projectSettings.branding.guideSubtitle || '')}</p>
            `;
            area.appendChild(coverDiv);

            // 2. 목차 (TOC) 렌더링
            for (let p = 0; p < tocPages; p++) {
                let chunk = tocPagesData[p];
                
                let tocHtml = `<div class="toc-container">`;
                chunk.forEach(line => {
                    if (line.type === 'chapter') {
                        tocHtml += `<div class="toc-chapter">${escapeHtml(line.text)}</div>`;
                    } else if (line.type === 'middle') {
                        let anchor = line.slideIndex !== undefined ? `preview-slide-${line.slideIndex}` : `preview-cover-${line.renderableIndex}`;
                        let pageNum = 1 + tocPages + line.renderableIndex + 1;
                        tocHtml += `<div class="toc-middle" onclick="document.getElementById('${anchor}').scrollIntoView({behavior: 'smooth', block: 'start'})" style="cursor:pointer;" title="Page ${pageNum}">${escapeHtml(line.text)}</div>`;
                    } else if (line.type === 'title') {
                        let pageNum = 1 + tocPages + line.renderableIndex + 1; 
                        tocHtml += `<div class="toc-title" onclick="document.getElementById('preview-slide-${line.slideIndex}').scrollIntoView({behavior: 'smooth', block: 'start'})">
                            <span>${escapeHtml(line.text)}</span> 
                            <span class="toc-page">Page ${pageNum}</span>
                        </div>`;
                    }
                });
                tocHtml += `</div>`;

                const tocDiv = document.createElement('div');
                tocDiv.className = 'slide-preview';
                tocDiv.innerHTML = `
                    <div class="preview-header" style="border-left: 4px solid var(--text-main);">
                        <div class="preview-title" style="color: var(--hpe-green);">목차 (Table of Contents) ${tocPages > 1 ? `(${p+1}/${tocPages})` : ''}</div>
                    </div>
                    <div class="preview-body" style="flex-direction: column;">
                        <div class="box" style="background: transparent; border: none; padding: 0;">
                            ${tocHtml}
                        </div>
                    </div>
                    <div class="preview-footer">
                        <span>${escapeHtml(projectSettings.branding.footerCopy || 'My Guide')}</span>
                        <span>PAGE ${p + 2}</span>
                    </div>
                `;
                area.appendChild(tocDiv);
            }

            // 3. 본문 슬라이드 루프
            let rIndex = 0;
            let prevCh = null;
            let prevMid = null;
            for (let i = 0; i <= slidesData.length; i++) {
                
                // [1] '새 슬라이드 추가' 폼 또는 구분선
                if (activeEditorIndex === i) {
                    
                    // 직전 슬라이드의 챕터, 중제목, 소제목 가져오기 (하위 호환성 적용)
                    let defaultChapter = '';
                    let defaultMiddleTitle = '';
                    let defaultTitle = '';
                    if (i > 0 && slidesData[i - 1]) {
                        defaultChapter = escapeHtml(slidesData[i - 1].chapter);
                        defaultMiddleTitle = escapeHtml(slidesData[i - 1].middleTitle || '');
                        defaultTitle = escapeHtml(slidesData[i - 1].title);
                    }
                    
                    const editorDiv = document.createElement('div');
                    editorDiv.className = 'editor-section';
                    editorDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 style="margin: 0;"><i class="fa-solid fa-pen-to-square"></i> ${slidesData.length === 0 ? '첫 번째 슬라이드 작성하기' : '새 슬라이드 추가'}</h3>
                            <button type="button" class="btn-cancel" onclick="window.cancelEditor()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="input-group">
                            <input type="text" id="input-chapter" value="${defaultChapter}" placeholder="대제목 (예: 1. 시스템 설정)">
                            <input type="text" id="input-middle-title" value="${defaultMiddleTitle}" placeholder="중제목 (예: 1.1 네트워크 설정) - 선택">
                            <input type="text" id="input-title" value="${defaultTitle}" placeholder="소제목 (예: 1.1.1 관리 IP 설정)">
                        </div>
                        <textarea id="input-text" placeholder="가이드 상세 내용을 작성하세요. (Markdown 문법 지원)\n## 소제목\n* 설명\n\n\`\`\`bash\n코드 블록 작성 시 여기에 코드를 넣으세요.\n\`\`\`"></textarea>
                        <div class="file-upload-wrapper" style="flex-wrap: wrap;">
                            <i class="fa-regular fa-image" style="color: var(--text-dim);"></i>
                            <input type="file" id="input-image" accept="image/*" style="min-width: 200px;" onchange="document.getElementById('input-layout-ratio-container').style.display='flex'">
                            <span style="font-size: 12px; color: #484f58; flex: 1;">(선택) 스크린샷 이미지 업로드</span>
                            <input type="text" id="input-image-caption" placeholder="이미지 설명 (선택사항)" style="width: 100%; margin-top: 10px;">
                        </div>
                        <div class="file-upload-wrapper" id="input-layout-ratio-container" style="display: none; flex-direction: column; align-items: stretch; gap: 5px; margin-top: 5px;">
                            <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-dim);">
                                <span><i class="fa-solid fa-align-left"></i> 텍스트 영역</span>
                                <span id="input-ratio-text">50% : 50%</span>
                                <span>이미지 영역 <i class="fa-regular fa-image"></i></span>
                            </div>
                            <input type="range" id="input-text-ratio" min="20" max="80" value="50" style="width: 100%; cursor: pointer;" oninput="document.getElementById('input-ratio-text').innerText = this.value + '% : ' + (100 - this.value) + '%'">
                            <div style="font-size: 11px; text-align: center; color: #484f58;">텍스트와 이미지가 모두 있을 때 너비 조절용입니다.</div>
                        </div>
                        <button type="button" class="btn-add" onclick="window.insertNewSlide(${i})">
                            <i class="fa-solid fa-plus"></i> 슬라이드 생성
                        </button>
                    `;
                    area.appendChild(editorDiv);
                } else {
                    const dividerDiv = document.createElement('div');
                    dividerDiv.className = 'add-divider';
                    dividerDiv.innerHTML = `
                        <button type="button" onclick="window.openEditor(${i})" title="새 슬라이드 추가"><i class="fa-solid fa-plus"></i></button>
                    `;
                    area.appendChild(dividerDiv);
                }

                // [2] 기존 슬라이드 프리뷰 또는 '수정' 폼
                if (i < slidesData.length) {
                    const slide = slidesData[i];
                    
                    let ch = slide.chapter || '대제목 미지정';
                    let mid = slide.middleTitle || '';
                    if (ch !== prevCh) {
                        prevCh = ch;
                        prevMid = null;
                    }
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
                        rIndex++; // 가상 표지가 1페이지 차지
                        prevMid = mid;
                    }

                    if (editingSlideIndex === i) {
                        // ==== 수정 모드 폼 ====
                        const editDiv = document.createElement('div');
                        editDiv.className = 'editor-section edit-mode';
                        
                        const existingImageDeleteCheck = slide.image ? `
                            <div style="margin-top: 5px; font-size: 13px; display: flex; align-items: center; gap: 5px;">
                                <input type="checkbox" id="edit-delete-image" style="width: auto; cursor: pointer;">
                                <label for="edit-delete-image" style="cursor:pointer; color: #ff5c5c;"><i class="fa-solid fa-trash-can"></i> 기존 사진 삭제하기</label>
                            </div>
                        ` : '';

                        editDiv.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h3 style="margin: 0;"><i class="fa-solid fa-pen"></i> 슬라이드 수정 중</h3>
                                <button type="button" class="btn-cancel" onclick="window.cancelEditSlide()"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                            <div class="input-group">
                                <input type="text" id="edit-chapter" value="${escapeHtml(slide.chapter)}" placeholder="대제목">
                                <input type="text" id="edit-middle-title" value="${escapeHtml(slide.middleTitle || '')}" placeholder="중제목 (선택)">
                                <input type="text" id="edit-title" value="${escapeHtml(slide.title)}" placeholder="소제목">
                            </div>
                            <textarea id="edit-text" placeholder="가이드 상세 내용을 작성하세요. (Markdown 문법 지원)">${escapeHtml(slide.text)}</textarea>
                            <div class="file-upload-wrapper" style="flex-wrap: wrap;">
                                <i class="fa-regular fa-image" style="color: var(--text-dim);"></i>
                                <input type="file" id="edit-image" accept="image/*" style="min-width: 200px;" onchange="if(this.files.length) document.getElementById('edit-layout-ratio-container').style.display='flex'">
                                <span style="font-size: 12px; color: #484f58; flex: 1;">
                                    ${slide.image ? '(선택) 새 이미지 업로드 시 기존 이미지 교체' : '(선택) 스크린샷 이미지 업로드'}
                                </span>
                                <input type="text" id="edit-image-caption" value="${escapeHtml(slide.imageCaption || '')}" placeholder="이미지 설명 (선택사항)" style="width: 100%; margin-top: 10px;">
                            </div>
                            <div class="file-upload-wrapper" id="edit-layout-ratio-container" style="display: ${slide.image ? 'flex' : 'none'}; flex-direction: column; align-items: stretch; gap: 5px; margin-top: 5px;">
                                <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-dim);">
                                    <span><i class="fa-solid fa-align-left"></i> 텍스트 영역</span>
                                    <span id="edit-ratio-text">${slide.textRatio || 50}% : ${100 - (slide.textRatio || 50)}%</span>
                                    <span>이미지 영역 <i class="fa-regular fa-image"></i></span>
                                </div>
                                <input type="range" id="edit-text-ratio" min="20" max="80" value="${slide.textRatio || 50}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('edit-ratio-text').innerText = this.value + '% : ' + (100 - this.value) + '%'">
                                <div style="font-size: 11px; text-align: center; color: #484f58;">텍스트와 이미지가 모두 있을 때 너비 조절용입니다.</div>
                            </div>
                            ${existingImageDeleteCheck}
                            <button type="button" class="btn-add" onclick="window.saveEditSlide(${i})">
                                <i class="fa-solid fa-check"></i> 변경사항 저장
                            </button>
                        `;
                        area.appendChild(editDiv);

                    } else {
                        // ==== 일반 프리뷰 모드 ====
                        const contentPageNumber = 1 + tocPages + rIndex + 1; // 표지(1) + TOC페이지들 + 실 페이지 수 + 1
                        
                        // 텍스트/이미지 유무 판별
                        const hasText = slide.text && slide.text.trim() !== '';
                        const hasImage = !!slide.image;

                        // Markdown 파싱
                        const parsedMarkdownText = marked.parse(slide.text || '');

                        let currentRatio = slide.textRatio || 50;
                        let txtFlex = (hasImage && hasText) ? currentRatio : 100;
                        let imgFlex = (hasImage && hasText) ? (100 - currentRatio) : 100;

                        let textContentHtml = '';
                        if (hasText) {
                            textContentHtml = `
                                <div class="box" style="flex: ${txtFlex};">
                                    <div class="markdown-body">${parsedMarkdownText}</div>
                                </div>
                            `;
                        } else if (!hasText && !hasImage) {
                            // 완전히 비어있을 경우 레이아웃 유지를 위한 빈 박스
                            textContentHtml = `<div class="box"></div>`;
                        }

                        let imageHtml = '';
                        if (hasImage) {
                            let captionHtml = slide.imageCaption ? `<div style="font-size:13px; color:var(--text-dim); text-align:center; margin-top:8px; width: 100%; word-break: break-all;">${escapeHtml(slide.imageCaption)}</div>` : '';
                            imageHtml = `<div class="box image-box" style="flex: ${imgFlex}; flex-direction: column;"><img src="${slide.image}" alt="Slide Image" onclick="window.openImageModal(this.src)" title="클릭하여 원본 보기">${captionHtml}</div>`;
                        }

                        const middleTitleHtml = slide.middleTitle 
                            ? `<div class="preview-middle-title">${escapeHtml(slide.middleTitle)}</div>` 
                            : '';

                        const slideDiv = document.createElement('div');
                        slideDiv.className = 'slide-preview';
                        slideDiv.id = `preview-slide-${i}`;
                        slideDiv.innerHTML = `
                            <div class="btn-action-group">
                                <button type="button" class="btn-icon btn-edit" onclick="window.openEditSlide(${i})" title="수정">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button type="button" class="btn-icon btn-delete" onclick="window.deleteSlide(${i})" title="삭제">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                            <div class="preview-header">
                                <div class="preview-chapter">${escapeHtml(slide.chapter)}</div>
                                ${middleTitleHtml}
                                <div class="preview-title">${escapeHtml(slide.title)}</div>
                            </div>
                            <div class="preview-body">
                                ${textContentHtml}
                                ${imageHtml}
                            </div>
                            <div class="preview-footer">
                                <span>${escapeHtml(projectSettings.branding.footerCopy || 'My Guide')}</span>
                                <span>PAGE ${contentPageNumber}</span>
                            </div>
                        `;
                        area.appendChild(slideDiv);
                    }
                    rIndex++; // 본문 페이지 카운트 +1
                }
            }

            if(slidesData.length > 0) {
                status.innerHTML = `현재 <strong>표지 1장 + 목차 ${tocPages}장 + 본문 ${slidesData.length}장</strong>의 슬라이드가 작성되었습니다.`;
            } else {
                status.innerHTML = `시작하려면 아래 폼을 작성하고 생성 버튼을 눌러주세요.`;
            }

            // 동적 TOC 사이드바 갱신
            updateDynamicTOC();
        };

        // ===========================
        // 동적 TOC 사이드바 구축 함수
        // ===========================
        let tocObserver = null; // IntersectionObserver 인스턴스 보관

        function updateDynamicTOC() {
            const nav = document.getElementById('toc-navigator');
            if (!nav) return;

            // 슬라이드가 없을 때 빈 메시지 표시
            if (slidesData.length === 0) {
                nav.innerHTML = `
                    <div class="toc-sidebar-title"><i class="fa-solid fa-list"></i> Navigator</div>
                    <div class="toc-sidebar-empty">
                        <i class="fa-solid fa-file-circle-plus" style="font-size:22px; margin-bottom: 8px; display: block;"></i>
                        슬라이드를 추가하면<br>목차가 여기에 표시됩니다.
                    </div>
                `;
                return;
            }

            let html = `<div class="toc-sidebar-title"><i class="fa-solid fa-list"></i> Navigator</div>`;
            let prevCh  = null;
            let prevMid = null;
            const titleKeyToTocId = {}; // 복합키(챕터+중제목+소제목) → 첫 toc-item id
            const slideToTocId    = {}; // 슬라이드 인덱스 → toc-item id (중복 포함)

            slidesData.forEach((s, i) => {
                const ch  = s.chapter     || '대제목 미지정';
                const mid = s.middleTitle || '';
                const tit = s.title       || '소제목 없음';

                // 대제목: 변경 시에만 헤더 노출, 중제목 추적 초기화
                if (ch !== prevCh) {
                    html += `<div class="toc-nav-chapter" title="${escapeHtml(ch)}">${escapeHtml(ch)}</div>`;
                    prevCh  = ch;
                    prevMid = null;
                }

                // 중제목: 변경 시에만 헤더 노출
                if (mid && mid !== prevMid) {
                    html += `<div class="toc-nav-middle" title="${escapeHtml(mid)}" onclick="document.getElementById('preview-slide-${i}')?.scrollIntoView({behavior:'smooth', block:'start'})">${escapeHtml(mid)}</div>`;
                    prevMid = mid;
                }

                // 소제목: 같은 챕터+중제목+소제목 조합이면 하나로 합침
                const key = `${ch}||${mid}||${tit}`;
                if (titleKeyToTocId[key] !== undefined) {
                    // 중복: 새 항목을 그리지 않고, 이 슬라이드를 첫 번째 항목 id에 연결
                    slideToTocId[i] = titleKeyToTocId[key];
                } else {
                    // 최초 등장: 항목 렌더링 및 맵 등록
                    const tocId = `toc-item-${i}`;
                    titleKeyToTocId[key] = tocId;
                    slideToTocId[i]      = tocId;
                    html += `<div class="toc-nav-title" id="${tocId}" data-slide="${i}" title="${escapeHtml(tit)}" onclick="document.getElementById('preview-slide-${i}')?.scrollIntoView({behavior:'smooth', block:'start'})">${escapeHtml(tit)}</div>`;
                }
            });

            nav.innerHTML = html;

            // 기존 옵저버 해제 후 재등록
            if (tocObserver) tocObserver.disconnect();

            const slideEls = document.querySelectorAll('.slide-preview[id^="preview-slide-"]');
            if (slideEls.length === 0) return;

            tocObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;

                    const idParts = entry.target.id.split('-');
                    const idx     = parseInt(idParts[idParts.length - 1], 10);

                    // 모든 활성 클래스 초기화
                    document.querySelectorAll('.toc-nav-title.active').forEach(el => el.classList.remove('active'));

                    // 중복 슬라이드도 첫 번째 항목 id로 하이라이트
                    // (사이드바 자동 스크롤 없음 — 사용자 지정 위치 유지)
                    const tocId  = slideToTocId[idx];
                    const tocItem = tocId ? document.getElementById(tocId) : null;
                    if (tocItem) tocItem.classList.add('active');
                });
            }, {
                rootMargin: '-20% 0px -60% 0px',
                threshold: 0
            });

            slideEls.forEach(el => tocObserver.observe(el));
        }


        // PPTX 파일 생성 다운로드

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

            // 3. 본문 슬라이드 생성
            let prevChPPTX = null;
            let prevMidPPTX = null;
            slidesData.forEach(data => {
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
        function generateHTMLContent() {
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
            const tocLines = generateTocData(slidesData);
            const tocPagesData = slidesData.length > 0 ? paginateTocData(tocLines) : [];
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
        .markdown-body code { background: #f3f4f6; color: #ef4444; padding: 2px 5px; border-radius: 4px; font-family: 'D2Coding', monospace; font-size: 0.9em; }
        
        /* Markdown Code Block Styles */
        .markdown-body pre { background: #111827; color: #10b981; padding: 15px; border-radius: 8px; overflow-x: auto; margin-top: 0; margin-bottom: 1em; border: 1px solid #374151; border-left: 3px solid ${accentColor};}
        .markdown-body pre code { background: transparent; color: inherit; padding: 0; font-size: 14px;}
        
        .markdown-body blockquote { border-left: 4px solid #d1d5db; margin: 0 0 1em 0; padding-left: 15px; color: #6b7280; font-style: italic; }
        
        .toc-link { text-decoration: none; display: block; transition: 0.2s; border-radius: 6px; }
        .toc-link:hover { background-color: ${accentColor}0D; padding-left: 5px; }

        /* Dark Mode Variables for Web Guide */
        body.dark-mode { background: #010409; color: #ffffff; }
        body.dark-mode .card { background: #0d1117; border-color: #30363d; }
        body.dark-mode .card-header { background: #161b22; border-color: #30363d; border-left-color: #00e676; }
        body.dark-mode .text-content { color: #c9d1d9; }
        body.dark-mode .title { color: #ffffff; }
        body.dark-mode .middle-title { color: #8b949e; }
        body.dark-mode .markdown-body pre { background: #010409; color: #00e676; border-color: #30363d; }
        body.dark-mode .toc-link div { color: #c9d1d9 !important; border-bottom-color: #30363d !important; }
        body.dark-mode .toc-link:hover { background-color: ${darkAccent}0D; }

        /* Image Modal Styles */
        .img-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; justify-content: center; align-items: center; cursor: zoom-out; backdrop-filter: blur(5px); }
        .img-modal-content { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        
        /* Go to Top Button */
        .btn-top { position: fixed; bottom: 30px; right: 30px; width: 50px; height: 50px; background: #01a982; color: #fff; border-radius: 50%; border: none; font-size: 20px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; opacity: 0; visibility: hidden; transition: 0.3s; z-index: 9999; }
        .btn-top.show { opacity: 1; visibility: visible; }
        .btn-top:hover { transform: translateY(-5px); background: #008767; }

        /* Theme Toggle Floating Button */
        .btn-theme { position: fixed; bottom: 90px; right: 30px; width: 50px; height: 50px; background: #374151; color: #fff; border-radius: 50%; border: none; font-size: 20px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 9999; transition: 0.3s; }
        .btn-theme:hover { transform: translateY(-3px); background: #4b5563; }
        body.dark-mode .btn-theme { background: #4b5563; }

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
        .code-block-wrapper { margin: 10px 0; border-radius: 6px; overflow: hidden; border: 1px solid #374151; border-left: 3px solid ${codeColor}; }
        .code-block-header { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 5px 14px; border-bottom: 1px solid #374151; }
        .code-lang-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${codeColor}; font-family: 'D2Coding', monospace; }
        .btn-copy-code { background: transparent; border: 1px solid #374151; color: #8b949e; font-size: 11px; padding: 3px 10px; border-radius: 4px; cursor: pointer; transition: 0.15s; font-family: sans-serif; }
        .btn-copy-code:hover, .btn-copy-code.copied { color: ${codeColor}; border-color: ${codeColor}; background: ${codeColor}1A; }
        .code-block-wrapper pre { margin: 0 !important; padding: 14px 16px !important; background: #111827 !important; border: none !important; overflow-x: auto; }
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
        // 테마 전환
        function toggleTheme() {
            const isDark = document.body.classList.toggle('dark-mode');
            document.getElementById('btn-theme').textContent = isDark ? '\u2600\ufe0f' : '\ud83c\udf19';
        }
    <\/script>

    <button type="button" class="btn-top" id="btn-top" onclick="scrollToTop()">▲</button>
    <button type="button" class="btn-theme" id="btn-theme" onclick="toggleTheme()" title="테마 전환">☀️</button>

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
            slidesData.forEach((slide, index) => {
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
                    let captionHtml = slide.imageCaption ? `<div style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 8px; width: 100%; word-break: break-all;">${escapeHtml(slide.imageCaption)}</div>` : '';
                    imgContentHtml = `<div class="img-content" style="flex: ${imgFlex}; flex-direction: column; align-items: center;"><img src="${slide.image}" alt="Slide ${index + 1} Image" onclick="openModal(this.src)" title="클릭하여 원본 보기">${captionHtml}</div>`;
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
        window.exportToHTML = function() {
            if (slidesData.length === 0) {
                showModal('다운로드할 슬라이드가 없습니다!');
                return;
            }
            
            const htmlContent = generateHTMLContent();
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'SlideEditor_Web_Guide.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // 데이터(JSON) 파일 저장
        window.exportData = async function() {
            if (slidesData.length === 0) {
                showModal('저장할 슬라이드 데이터가 없습니다.');
                return;
            }
            
            const dataStr = JSON.stringify({ settings: projectSettings, slides: slidesData }, null, 2);

            try {
                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: dataStr
                });
                
                if (response.ok) {
                    showModal('웹 서버(slide_data.json)에 직접 로컬 저장을 성공적으로 완료했습니다!');
                    return;
                }
            } catch (err) {
                console.warn('서버 저장 실패, 기존 다운로드 방식으로 돌아갑니다.', err);
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
            
            const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vme_data_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showModal('웹 서버 연동을 실패하여 브라우저 다운로드 방식을 통해 백업본으로 저장(다운로드)했습니다.');
        };

        // 수동 데이터(JSON) 파일 다운로드 (PC 로컬)
        window.downloadData = function() {
            if (slidesData.length === 0) {
                showModal('다운로드할 슬라이드 데이터가 없습니다.');
                return;
            }
            
            const dataStr = JSON.stringify({ settings: projectSettings, slides: slidesData }, null, 2);
            
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
            a.download = `vme_data_${timestamp}.json`;
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
                    const importedData = JSON.parse(e.target.result);

                    // 구버전(배열) 및 신버전(래퍼 객체) 자동 판별
                    if (Array.isArray(importedData)) {
                        // ── 구버전 호환: 슬라이드만 교체, settings는 현재 값 유지
                        slidesData = migrateData(importedData);
                        showModal('구버전 데이터를 불러왔습니다. 브랜딩/테마 설정은 현재 값을 유지합니다.');
                    } else if (importedData && Array.isArray(importedData.slides)) {
                        // ── 신버전 래퍼 구조
                        parseLoadedData(importedData);
                        // 저장된 테마 자동 적용
                        await loadThemeByName(projectSettings.activeTheme);
                        // 브랜딩 UI 갱신
                        syncBrandingUI();
                        showModal('데이터를 성공적으로 불러왔습니다!');
                    } else {
                        showModal('올바른 데이터 형식이 아닙니다.\n지원 형식: 슬라이드 배열([]) 또는 {settings, slides} 객체');
                        return;
                    }

                    activeEditorIndex = null;
                    editingSlideIndex = null;
                    window.renderPreview();
                } catch (err) {
                    console.error('데이터 파일 불러오기 오류:', err);
                    showModal('데이터 파일을 읽는 중 오류가 발생했습니다.\n' + err.message);
                }
                event.target.value = ''; // input 초기화
            };
            reader.readAsText(file);
        };

        // ===========================
        // 테마 엔진
        // ===========================

        // 기본 테마 오브젝트 (서버 연동 실패 시 폴백)
        function getDefaultThemeObject() {
            return {
                name: 'hpe_default',
                displayName: 'HPE Default (Dark)',
                version: '1.0',
                isDarkMode: true,
                colors: {
                    accent:   '#00E676',
                    codeColor:'#00E676',
                    bgDark:   '#010409',
                    slideBg:  '#0D1117',
                    boxBg:    '#161B22',
                    border:   '#30363D',
                    textMain: '#FFFFFF',
                    textDim:  '#8B949E'
                },
                pptx: {
                    masterBg:      '0D1117',
                    coverBg:       '010409',
                    middleCoverBg: '111827',
                    accentColor:   '00E676',
                    codeColor:     '00E676',
                    textColor:     'C9D1D9',
                    dimColor:      '8B949E'
                },
                webGuide: {
                    headerBg:    '#01a982',
                    accentColor: '#01a982',
                    darkAccent:  '#00e676',
                    codeColor:   '#00e676'
                },
                fonts: {
                    uiFamily:   'Pretendard',
                    codeFamily: 'D2Coding',
                    pptxBody:   'Malgun Gothic',
                    pptxTitle:  'Arial'
                }
            };
        }

        // 에디터 CSS 변수를 테마로 교체
        function applyThemeToEditor(theme) {
            if (!theme || !theme.colors) return;
            const root = document.documentElement.style;
            root.setProperty('--hpe-green',     theme.colors.accent);
            root.setProperty('--hpe-green-alpha', theme.colors.accent + '14');
            root.setProperty('--code-color',    theme.colors.codeColor || theme.colors.accent);
            root.setProperty('--code-bg',       (theme.colors.codeColor || theme.colors.accent) + '1A');
            root.setProperty('--bg-dark',        theme.colors.bgDark);
            root.setProperty('--slide-bg',       theme.colors.slideBg);
            root.setProperty('--box-bg',         theme.colors.boxBg);
            root.setProperty('--border-color',   theme.colors.border);
            root.setProperty('--text-main',      theme.colors.textMain);
            root.setProperty('--text-dim',       theme.colors.textDim);
            
            if (theme.isDarkMode !== false) {
                document.body.classList.remove('light-mode');
            } else {
                document.body.classList.add('light-mode');
            }

            activeTheme = theme;
            projectSettings.activeTheme = theme.name;
        }

        // 테마 이름으로 서버에서 불러와 적용 (실패 시 기본 테마 폴백)
        async function loadThemeByName(name) {
            try {
                const filename = name.endsWith('.slidetheme') ? name : name + '.slidetheme';
                const res = await fetch('/api/themes/' + filename);
                if (res.ok) {
                    const theme = await res.json();
                    applyThemeToEditor(theme);
                    return;
                }
            } catch (e) {
                console.warn('[테마] 서버 로드 실패, 기본 테마 적용:', e);
            }
            // 폴백: 기본 테마
            applyThemeToEditor(getDefaultThemeObject());
        }

        // 테마 목록 불러오기 (모달용)
        window.loadThemeList = async function() {
            try {
                const res = await fetch('/api/themes');
                if (res.ok) return await res.json();
            } catch (e) { console.warn('[테마] 목록 로드 실패:', e); }
            return [];
        };

        // 테마 불러오기 및 에디터 적용
        window.loadTheme = async function(filename) {
            await loadThemeByName(filename.replace('.slidetheme', ''));
            renderThemeModal();
        };

        // 테마 서버 저장
        window.saveThemeToServer = async function(theme) {
            const filename = theme.name + '.slidetheme';
            try {
                const res = await fetch('/api/themes/' + filename, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(theme, null, 2)
                });
                return res.ok;
            } catch (e) {
                console.warn('[테마] 저장 실패:', e);
                return false;
            }
        };

        // 테마 파일 브라우저 다운로드
        window.exportTheme = function() {
            if (!activeTheme) return;
            const blob = new Blob([JSON.stringify(activeTheme, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (activeTheme.name || 'custom') + '.slidetheme';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // .slidetheme 파일 불러오기
        window.importTheme = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const theme = JSON.parse(e.target.result);
                    applyThemeToEditor(theme);
                    renderThemeModal();
                    showModal('테마를 불러왔습니다: ' + (theme.displayName || theme.name));
                } catch (err) {
                    showModal('.slidetheme 파일을 읽는 중 오류: ' + err.message);
                }
                event.target.value = '';
            };
            reader.readAsText(file);
        };

        // 브랜딩 UI 동기화 (모달 필드 → projectSettings 반영 or 반대)
        function syncBrandingUI() {
            const pn = document.getElementById('branding-project-name');
            const gs = document.getElementById('branding-guide-subtitle');
            const fc = document.getElementById('branding-footer-copy');
            if (pn) pn.value = projectSettings.branding.projectName;
            if (gs) gs.value = projectSettings.branding.guideSubtitle;
            if (fc) fc.value = projectSettings.branding.footerCopy;
        }

        function collectBrandingFromUI() {
            const pn = document.getElementById('branding-project-name');
            const gs = document.getElementById('branding-guide-subtitle');
            const fc = document.getElementById('branding-footer-copy');
            if (pn) projectSettings.branding.projectName   = pn.value.trim() || projectSettings.branding.projectName;
            if (gs) projectSettings.branding.guideSubtitle = gs.value.trim() || projectSettings.branding.guideSubtitle;
            if (fc) projectSettings.branding.footerCopy    = fc.value.trim() || projectSettings.branding.footerCopy;
        }

        // 테마 모달 렌더링
        function renderThemeModal() {
            const modal = document.getElementById('theme-modal');
            if (!modal) return;
            const t = activeTheme || getDefaultThemeObject();

            // 테마 목록 비동기 갱신
            window.loadThemeList().then(files => {
                const listEl = document.getElementById('theme-list-items');
                if (!listEl) return;
                listEl.innerHTML = files.map(f => {
                    const n = f.replace('.slidetheme', '');
                    const active = n === (t.name || '') ? 'active' : '';
                    return `<div class="theme-list-item ${active}" onclick="window.loadTheme('${f}')">${n}</div>`;
                }).join('');
            });

            // 색상 편집기 채우기
            const colorFields = [
                { key: 'accent',   label: '강조색 (Accent)' },
                { key: 'codeColor',label: '코드 텍스트색 (Code Color)' },
                { key: 'bgDark',   label: '에디터 배경 (bgDark)' },
                { key: 'slideBg',  label: '슬라이드 배경 (slideBg)' },
                { key: 'boxBg',    label: '박스 배경 (boxBg)' },
                { key: 'border',   label: '테두리 (border)' },
                { key: 'textMain', label: '주요 텍스트 (textMain)' },
                { key: 'textDim',  label: '보조 텍스트 (textDim)' }
            ];
            const editorEl = document.getElementById('theme-color-editor');
            if (editorEl) {
                editorEl.innerHTML = colorFields.map(({ key, label }) => {
                    const val = (t.colors && t.colors[key]) || '#000000';
                    return `
                    <div class="color-row">
                        <span class="color-row-label">${label}</span>
                        <input type="color" id="color-${key}" value="${val}"
                            oninput="document.getElementById('hex-${key}').value=this.value; applyColorPreview()">
                        <input type="text" id="hex-${key}" value="${val}" maxlength="7" class="hex-input"
                            oninput="syncPickerFromHex('${key}')">
                    </div>`;
                }).join('');
            }

            // 테마 이름
            const nameEl = document.getElementById('theme-name-input');
            if (nameEl) nameEl.value = t.name || '';

            // 다크 모드 체크박스
            const darkEl = document.getElementById('theme-is-dark');
            if (darkEl) darkEl.checked = t.isDarkMode !== false;

            // 브랜딩 UI
            syncBrandingUI();
        }

        // HEX 입력 → 픽커 동기화
        window.syncPickerFromHex = function(key) {
            const hexEl = document.getElementById('hex-' + key);
            const pickerEl = document.getElementById('color-' + key);
            if (!hexEl || !pickerEl) return;
            const val = hexEl.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                pickerEl.value = val;
                applyColorPreview();
            }
        };

        // 색상 및 다크모드 변경 → 에디터 실시간 미리보기
        window.applyColorPreview = function() {
            const isDark = document.getElementById('theme-is-dark')?.checked;
            if (isDark !== undefined) {
                if (isDark) document.body.classList.remove('light-mode');
                else document.body.classList.add('light-mode');
            }

            const keys = ['accent','codeColor','bgDark','slideBg','boxBg','border','textMain','textDim'];
            keys.forEach(key => {
                const hexEl = document.getElementById('hex-' + key);
                if (hexEl && /^#[0-9a-fA-F]{6}$/.test(hexEl.value)) {
                    const map = {
                        accent: '--hpe-green', codeColor: '--code-color', bgDark: '--bg-dark', slideBg: '--slide-bg',
                        boxBg: '--box-bg', border: '--border-color', textMain: '--text-main', textDim: '--text-dim'
                    };
                    document.documentElement.style.setProperty(map[key], hexEl.value);
                    if (key === 'codeColor' || (key === 'accent' && !document.getElementById('hex-codeColor'))) {
                        document.documentElement.style.setProperty('--code-bg', hexEl.value + '1A');
                    }
                }
            });
        };

        // 모달에서 현재 색상 수집 → 테마 오브젝트 빌드
        function buildThemeFromModal() {
            const keys = ['accent','codeColor','bgDark','slideBg','boxBg','border','textMain','textDim'];
            const colors = {};
            keys.forEach(k => {
                const hexEl = document.getElementById('hex-' + k);
                colors[k] = (hexEl && /^#[0-9a-fA-F]{6}$/.test(hexEl.value))
                    ? hexEl.value : (activeTheme && activeTheme.colors[k] || '#000000');
            });

            // strip # for pptx
            const strip = c => c.replace('#', '');
            const t = activeTheme || getDefaultThemeObject();
            const nameEl = document.getElementById('theme-name-input');
            const name = (nameEl ? nameEl.value.trim() : '') || t.name;

            const isDarkMode = document.getElementById('theme-is-dark') ? document.getElementById('theme-is-dark').checked : true;

            return {
                name,
                displayName: name,
                version: '1.0',
                isDarkMode,
                colors,
                pptx: {
                    masterBg:      strip(colors.slideBg),
                    coverBg:       strip(colors.bgDark),
                    middleCoverBg: '111827',
                    accentColor:   strip(colors.accent),
                    codeColor:     strip(colors.codeColor || colors.accent),
                    textColor:     strip(colors.textMain),
                    dimColor:      strip(colors.textDim)
                },
                webGuide: {
                    headerBg:    colors.accent,
                    accentColor: colors.accent,
                    darkAccent:  colors.accent
                },
                fonts: t.fonts || getDefaultThemeObject().fonts
            };
        }

        // 모달: 테마 적용 버튼 (브랜딩은 별개 모달에서 관리)
        window.applyThemeFromModal = function() {
            const theme = buildThemeFromModal();
            applyThemeToEditor(theme);
            showModal('테마가 적용되었습니다!');
        };

        // 모달: 서버 저장 버튼 (브랜딩은 별개 모달에서 관리)
        window.saveThemeFromModal = async function() {
            const theme = buildThemeFromModal();
            applyThemeToEditor(theme);
            const ok = await window.saveThemeToServer(theme);
            if (ok) {
                renderThemeModal(); // 목록 갱신
                showModal('테마를 서버에 저장했습니다: ' + theme.name + '.slidetheme');
            } else {
                showModal('서버 저장에 실패했습니다. 테마 내보내기를 이용해 수동 저장하세요.');
            }
        };

        // 테마 모달 열기/닫기
        window.openThemeModal = function() {
            const modal = document.getElementById('theme-modal');
            if (!modal) return;
            modal.style.display = 'flex';
            renderThemeModal();
        };
        window.closeThemeModal = function() {
            const modal = document.getElementById('theme-modal');
            if (modal) modal.style.display = 'none';
        };

        // ===========================
        // 브랜딩 모달 (별개 UI)
        // ===========================

        window.openBrandingModal = function() {
            const modal = document.getElementById('branding-modal');
            if (!modal) return;
            // 현재 projectSettings.branding 값을 필드에 채워 넣기
            syncBrandingUI();
            modal.style.display = 'flex';
        };

        window.closeBrandingModal = function() {
            const modal = document.getElementById('branding-modal');
            if (modal) modal.style.display = 'none';
        };

        // 브랜딩 적용: UI 값 수집 → projectSettings 갱신
        // (데이터 저장은 사용자가 exportData/downloadData 할 때 함께 저장됨)
        window.applyBrandingFromModal = function() {
            collectBrandingFromUI();
            window.closeBrandingModal();
            showModal(
                '브랜딩이 적용되었습니다.\n' +
                '웹 가이드/PPTX 내보내기 시 반영됩니다.\n' +
                '데이터 저장(저장 버튼)을 하면 다음에도 유지됩니다.'
            );
        };