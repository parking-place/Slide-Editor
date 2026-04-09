// Auto-extracted modular segment: Editor Base

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
            const MAX_TOC_UNITS_PER_SLIDE = 12.5;
            const TOC_LINE_UNITS = {
                chapter: 1.8,
                middle: 1.3,
                title: 1
            };
            let pages = [];
            let currentPage = [];
            let currentLineUnits = 0;
            
            for (let i = 0; i < tocLines.length; i++) {
                let line = tocLines[i];
                let lineUnits = TOC_LINE_UNITS[line.type] || 1;
                
                // 대제목이 나타났는데, 현재 페이지가 이미 뭔가 채워져 있다면 분리
                if (
                    (line.type === 'chapter' && currentPage.length > 0) ||
                    (currentPage.length > 0 && currentLineUnits + lineUnits > MAX_TOC_UNITS_PER_SLIDE)
                ) {
                    pages.push(currentPage);
                    currentPage = [];
                    currentLineUnits = 0;
                }
                
                currentPage.push(line);
                currentLineUnits += lineUnits;
            }
            if (currentPage.length > 0) {
                pages.push(currentPage);
            }
            return pages;
        }

        function countPreviewBodyPages(slides) {
            let totalPages = 0;
            let prevChapter = null;
            let prevMiddleTitle = null;

            slides.forEach((slide) => {
                const chapter = slide.chapter || '대제목 미지정';
                const middleTitle = slide.middleTitle || '';

                if (chapter !== prevChapter) {
                    prevChapter = chapter;
                    prevMiddleTitle = null;
                }

                if (middleTitle && middleTitle !== prevMiddleTitle) {
                    totalPages += 1;
                    prevMiddleTitle = middleTitle;
                }

                totalPages += 1;
            });

            return totalPages;
        }

        function getImageUploadContext(element) {
            const wrapper = element?.closest ? element.closest('.file-drop-zone') : null;
            if (!wrapper) {
                return null;
            }

            return {
                wrapper,
                input: document.getElementById(wrapper.dataset.inputId),
                layoutContainer: document.getElementById(wrapper.dataset.layoutId),
                status: document.getElementById(wrapper.dataset.statusId),
                captionContainer: document.getElementById(wrapper.dataset.captionId),
                deleteCheckbox: wrapper.dataset.deleteId ? document.getElementById(wrapper.dataset.deleteId) : null,
                defaultText: wrapper.dataset.defaultText || '',
                existingText: wrapper.dataset.existingText || wrapper.dataset.defaultText || ''
            };
        }

        function updateImageUploadUi(context) {
            if (!context || !context.status) {
                return;
            }

            const selectedFile = context.input?.files?.[0] || null;
            const hasExistingImage = context.wrapper.dataset.hasImage === 'true' && !context.deleteCheckbox?.checked;
            const hasImage = !!selectedFile || hasExistingImage;

            if (selectedFile && context.deleteCheckbox) {
                context.deleteCheckbox.checked = false;
            }
            if (selectedFile) {
                context.status.textContent = `선택된 파일: ${selectedFile.name}`;
                context.status.dataset.state = 'selected';
            } else if (hasExistingImage) {
                context.status.textContent = context.existingText;
                context.status.dataset.state = 'selected';
            } else {
                context.status.textContent = context.defaultText;
                context.status.dataset.state = 'idle';
            }

            context.wrapper.classList.toggle('has-image', hasImage);

            if (context.layoutContainer) {
                context.layoutContainer.style.display = hasImage ? 'flex' : 'none';
            }

            if (context.captionContainer) {
                context.captionContainer.style.display = hasImage ? 'flex' : 'none';
            }
        }

        window.handleImageInputChange = function(input) {
            updateImageUploadUi(getImageUploadContext(input));
        };

        window.handleImageZoneClick = function(event) {
            if (event.target.closest('input, textarea, button, label, a, output')) {
                return;
            }

            const context = getImageUploadContext(event.currentTarget);
            if (context?.input) {
                context.input.click();
            }
        };

        window.handleImageDragEnter = function(event) {
            event.preventDefault();
            const context = getImageUploadContext(event.currentTarget);
            if (context) {
                context.wrapper.classList.add('dragover');
            }
        };

        window.handleImageDragOver = function(event) {
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
            const context = getImageUploadContext(event.currentTarget);
            if (context) {
                context.wrapper.classList.add('dragover');
            }
        };

        window.handleImageDragLeave = function(event) {
            event.preventDefault();
            const context = getImageUploadContext(event.currentTarget);
            if (!context) {
                return;
            }

            if (!event.relatedTarget || !context.wrapper.contains(event.relatedTarget)) {
                context.wrapper.classList.remove('dragover');
            }
        };

        window.handleImageDrop = function(event) {
            event.preventDefault();
            const context = getImageUploadContext(event.currentTarget);
            if (!context || !context.input) {
                return;
            }

            context.wrapper.classList.remove('dragover');

            const droppedFiles = Array.from(event.dataTransfer?.files || []);
            const imageFile = droppedFiles.find(file => file.type.startsWith('image/'));
            if (!imageFile) {
                showModal('이미지 파일만 드래그해서 업로드할 수 있습니다.');
                return;
            }

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(imageFile);
            context.input.files = dataTransfer.files;
            updateImageUploadUi(context);
        };

        window.handleExistingImageToggle = function(input) {
            updateImageUploadUi(getImageUploadContext(input));
        };

        function syncAllImageUploadUi() {
            document.querySelectorAll('.file-drop-zone').forEach((zone) => {
                updateImageUploadUi(getImageUploadContext(zone));
            });
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

            // 1. 표지 고정 노출
            const coverDiv = document.createElement('div');
            coverDiv.className = 'slide-preview cover-preview';
            coverDiv.innerHTML = `
                <h1>${escapeHtml(projectSettings.branding.projectName || 'My Guide')}</h1>
                <p class="sub">${escapeHtml(projectSettings.branding.guideSubtitle || '')}</p>
            `;
            area.appendChild(coverDiv);

            // 2. 본문 슬라이드 루프
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
                    const newImageUploadDefaultText = '스크린샷 이미지 업로드 또는 드래그앤드롭';
                                        editorDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 style="margin: 0;"><i class="fa-solid fa-pen-to-square"></i> ${slidesData.length === 0 ? '??? ???? ????' : '? ???? ??'}</h3>
                            <button type="button" class="btn-cancel" onclick="window.cancelEditor()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="input-group">
                            <input type="text" id="input-chapter" value="${defaultChapter}" placeholder="??? (?: 1. ??? ??)">
                            <input type="text" id="input-middle-title" value="${defaultMiddleTitle}" placeholder="??? (?: 1.1 ???? ??) - ??">
                            <input type="text" id="input-title" value="${defaultTitle}" placeholder="??? (?: 1.1.1 ?? IP ??)">
                        </div>
                        <div class="editor-compose-grid">
                            <div class="editor-compose-body">
                                <textarea id="input-text" placeholder="??? ?? ??? ?????. (Markdown ?? ??)&#10;## ??&#10;* ??&#10;&#10;\`\`\`bash&#10;?? ?? ??? ?????.&#10;\`\`\`"></textarea>
                            </div>
                            <div class="editor-compose-media">
                                <div class="file-upload-wrapper file-drop-zone media-drop-panel"
                                    data-input-id="input-image"
                                    data-layout-id="input-layout-ratio-container"
                                    data-status-id="input-image-status"
                                    data-caption-id="input-image-caption-wrap"
                                    data-default-text="${escapeHtml(newImageUploadDefaultText)}"
                                    data-existing-text="??? ???? ????."
                                    data-has-image="false"
                                    onclick="window.handleImageZoneClick(event)"
                                    ondragenter="window.handleImageDragEnter(event)"
                                    ondragover="window.handleImageDragOver(event)"
                                    ondragleave="window.handleImageDragLeave(event)"
                                    ondrop="window.handleImageDrop(event)">
                                    <input type="file" id="input-image" accept="image/*" class="visually-hidden-file-input" onchange="window.handleImageInputChange(this)">
                                    <div class="media-drop-icon"><i class="fa-solid fa-plus"></i></div>
                                    <div class="media-drop-copy">
                                        <strong>??? ??</strong>
                                        <span>???? ???? ???????</span>
                                    </div>
                                    <button type="button" class="media-drop-browse" onclick="document.getElementById('input-image').click(); event.stopPropagation();">
                                        <i class="fa-regular fa-folder-open"></i> ?? ??
                                    </button>
                                    <span id="input-image-status" class="file-upload-status">${escapeHtml(newImageUploadDefaultText)}</span>
                                </div>
                                <div class="media-caption-wrap" id="input-image-caption-wrap" style="display: none;">
                                    <label for="input-image-caption">??? ??</label>
                                    <input type="text" id="input-image-caption" placeholder="??? ?? (????)">
                                </div>
                                <div class="file-upload-wrapper media-ratio-panel" id="input-layout-ratio-container" style="display: none; flex-direction: column; align-items: stretch; gap: 5px; margin-top: 5px;">
                                    <div class="media-ratio-labels">
                                        <span><i class="fa-solid fa-align-left"></i> ??? ??</span>
                                        <span id="input-ratio-text">50% : 50%</span>
                                        <span>??? ?? <i class="fa-regular fa-image"></i></span>
                                    </div>
                                    <input type="range" id="input-text-ratio" min="20" max="80" value="50" style="width: 100%; cursor: pointer;" oninput="document.getElementById('input-ratio-text').innerText = this.value + '% : ' + (100 - this.value) + '%'">
                                    <div class="media-ratio-help">???? ???? ?? ?? ? ??? ?????.</div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn-add" onclick="window.insertNewSlide(${i})">
                            <i class="fa-solid fa-plus"></i> ???? ??
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
                        const editImageUploadDefaultText = slide.image
                            ? '새 이미지 업로드 또는 드래그앤드롭 시 기존 이미지 교체'
                            : '스크린샷 이미지 업로드 또는 드래그앤드롭';
                        
                        const existingImageDeleteCheck = slide.image ? `
                            <div style="margin-top: 5px; font-size: 13px; display: flex; align-items: center; gap: 5px;">
                                <input type="checkbox" id="edit-delete-image" style="width: auto; cursor: pointer;" onchange="window.handleExistingImageToggle(this)">
                                <label for="edit-delete-image" style="cursor:pointer; color: #ff5c5c;"><i class="fa-solid fa-trash-can"></i> 기존 사진 삭제하기</label>
                            </div>
                        ` : '';

                                                editDiv.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h3 style="margin: 0;"><i class="fa-solid fa-pen"></i> ???? ?? ?</h3>
                                <button type="button" class="btn-cancel" onclick="window.cancelEditSlide()"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                            <div class="input-group">
                                <input type="text" id="edit-chapter" value="${escapeHtml(slide.chapter)}" placeholder="???">
                                <input type="text" id="edit-middle-title" value="${escapeHtml(slide.middleTitle || '')}" placeholder="???(??)">
                                <input type="text" id="edit-title" value="${escapeHtml(slide.title)}" placeholder="???">
                            </div>
                            <div class="editor-compose-grid">
                                <div class="editor-compose-body">
                                    <textarea id="edit-text" placeholder="??? ?? ??? ?????. (Markdown ?? ??)">${escapeHtml(slide.text)}</textarea>
                                </div>
                                <div class="editor-compose-media">
                                    <div class="file-upload-wrapper file-drop-zone media-drop-panel"
                                        data-input-id="edit-image"
                                        data-layout-id="edit-layout-ratio-container"
                                        data-status-id="edit-image-status"
                                        data-caption-id="edit-image-caption-wrap"
                                        data-delete-id="edit-delete-image"
                                        data-default-text="${escapeHtml(editImageUploadDefaultText)}"
                                        data-existing-text="??? ???? ????. ? ??? ???? ?????."
                                        data-has-image="${slide.image ? 'true' : 'false'}"
                                        onclick="window.handleImageZoneClick(event)"
                                        ondragenter="window.handleImageDragEnter(event)"
                                        ondragover="window.handleImageDragOver(event)"
                                        ondragleave="window.handleImageDragLeave(event)"
                                        ondrop="window.handleImageDrop(event)">
                                        <input type="file" id="edit-image" accept="image/*" class="visually-hidden-file-input" onchange="window.handleImageInputChange(this)">
                                        <div class="media-drop-icon"><i class="fa-solid fa-plus"></i></div>
                                        <div class="media-drop-copy">
                                            <strong>??? ??</strong>
                                            <span>???? ???? ???????</span>
                                        </div>
                                        <button type="button" class="media-drop-browse" onclick="document.getElementById('edit-image').click(); event.stopPropagation();">
                                            <i class="fa-regular fa-folder-open"></i> ?? ??
                                        </button>
                                        <span id="edit-image-status" class="file-upload-status">${escapeHtml(editImageUploadDefaultText)}</span>
                                    </div>
                                    <div class="media-caption-wrap" id="edit-image-caption-wrap" style="display: ${slide.image ? 'flex' : 'none'};">
                                        <label for="edit-image-caption">??? ??</label>
                                        <input type="text" id="edit-image-caption" value="${escapeHtml(slide.imageCaption || '')}" placeholder="??? ?? (????)">
                                    </div>
                                    <div class="file-upload-wrapper media-ratio-panel" id="edit-layout-ratio-container" style="display: ${slide.image ? 'flex' : 'none'}; flex-direction: column; align-items: stretch; gap: 5px; margin-top: 5px;">
                                        <div class="media-ratio-labels">
                                            <span><i class="fa-solid fa-align-left"></i> ??? ??</span>
                                            <span id="edit-ratio-text">${slide.textRatio || 50}% : ${100 - (slide.textRatio || 50)}%</span>
                                            <span>??? ?? <i class="fa-regular fa-image"></i></span>
                                        </div>
                                        <input type="range" id="edit-text-ratio" min="20" max="80" value="${slide.textRatio || 50}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('edit-ratio-text').innerText = this.value + '% : ' + (100 - this.value) + '%'">
                                        <div class="media-ratio-help">???? ???? ?? ?? ? ??? ?????.</div>
                                    </div>
                                    ${existingImageDeleteCheck}
                                </div>
                            </div>
                            <button type="button" class="btn-add" onclick="window.saveEditSlide(${i})">
                                <i class="fa-solid fa-check"></i> ???? ??
                            </button>
                        `;
                        area.appendChild(editDiv);

                    } else {
                        // ==== 일반 프리뷰 모드 ====
                        const contentPageNumber = rIndex + 2; // 표지(1) + 본문/구분 페이지 누적 + 현재 페이지
                        
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
                            const imageSrc = getSlideImageSrc(slide.image);
                            let captionHtml = slide.imageCaption ? `<div style="font-size:13px; color:var(--text-dim); text-align:center; margin-top:8px; width: 100%; word-break: break-all;">${escapeHtml(slide.imageCaption)}</div>` : '';
                            imageHtml = `<div class="box image-box" style="flex: ${imgFlex}; flex-direction: column;"><img src="${imageSrc}" alt="Slide Image" onclick="window.openImageModal(this.src)" title="클릭하여 원본 보기">${captionHtml}</div>`;
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

            const projectLabel = currentProject?.name
                ? `<strong>${escapeHtml(currentProject.name)}</strong> 프로젝트`
                : '현재 프로젝트';

            if(slidesData.length > 0) {
                status.innerHTML = `${projectLabel}에서 <strong>표지 1장 + 본문 ${countPreviewBodyPages(slidesData)}장</strong>이 준비되었습니다.`;
            } else {
                status.innerHTML = `${projectLabel}는 비어 있습니다. 아래 폼에서 첫 슬라이드를 작성해보세요.`;
            }

            // 동적 TOC 사이드바 갱신
            syncAllImageUploadUi();
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
                        <i class="fa-solid fa-file-circle-plus toc-sidebar-empty-icon"></i>
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


