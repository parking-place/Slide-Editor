// Auto-extracted modular segment: State

// === SAVE DATA START ===
        let slidesData = [];
        // === SAVE DATA END ===

        function getDefaultProjectSettings(projectName = 'My Guide') {
            return {
                activeTheme: 'nvidia_light',
                branding: {
                    projectName,
                    guideSubtitle: '가이드 부제',
                    footerCopy: projectName
                }
            };
        }

        function normalizeProjectName(projectName, fallback = 'My Guide') {
            const safeName = typeof projectName === 'string' ? projectName.trim() : '';
            return safeName || fallback;
        }

        function buildProjectSettingsDocument(settings = projectSettings, projectName = currentProject?.name || settings?.branding?.projectName || 'My Guide') {
            const resolvedProjectName = normalizeProjectName(projectName);
            const defaultSettings = getDefaultProjectSettings(resolvedProjectName);
            const safeSettings = settings && typeof settings === 'object' ? settings : {};
            const safeBranding = safeSettings.branding && typeof safeSettings.branding === 'object'
                ? safeSettings.branding
                : {};

            return {
                activeTheme: safeSettings.activeTheme || defaultSettings.activeTheme,
                branding: Object.assign({}, defaultSettings.branding, safeBranding, {
                    projectName: resolvedProjectName
                })
            };
        }

        function syncProjectBrandingName(projectName = currentProject?.name || projectSettings?.branding?.projectName || 'My Guide') {
            projectSettings = buildProjectSettingsDocument(projectSettings, projectName);
            return projectSettings.branding.projectName;
        }

        let projectSettings = getDefaultProjectSettings();
        let currentProject = null;
        let currentAppVersion = '';
        let availableProjects = [];
        let projectModalState = {
            mode: 'open',
            selectedProjectId: null,
            isSubmitting: false,
            isNewProjectSubmitting: false,
            isLoadingSelection: false,
            selectedProjectDataId: null,
            selectedProjectData: null,
            nameDraft: '',
            newProjectDraft: {
                name: '',
                subtitle: '',
                footer: ''
            }
        };

        let activeTheme = null;
        const LEGACY_IMAGE_DATA_PREFIX = '/data/image_data/';

        let activeEditorIndex = null;
        let editingSlideIndex = null;

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

        window.copyCode = function(btn) {
            const code = btn.closest('.code-block-wrapper').querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> 복사됨';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-regular fa-copy"></i> 복사';
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = code;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                btn.innerHTML = '<i class="fa-solid fa-check"></i> 복사됨';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-regular fa-copy"></i> 복사';
                    btn.classList.remove('copied');
                }, 2000);
            });
        };

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

        function parseLoadedData(data) {
            const nextSettings = getDefaultProjectSettings();

            if (Array.isArray(data)) {
                slidesData = migrateData(data);
                projectSettings = nextSettings;
                return;
            }

            if (data && typeof data === 'object' && Array.isArray(data.slides)) {
                slidesData = migrateData(data.slides);
                projectSettings = buildProjectSettingsDocument({
                    activeTheme: data.settings?.activeTheme || nextSettings.activeTheme,
                    branding: Object.assign({}, nextSettings.branding, data.settings?.branding || {})
                }, data.settings?.branding?.projectName || nextSettings.branding.projectName);
                return;
            }

            slidesData = [];
            projectSettings = nextSettings;
        }

        function normalizeSavedVersion(versionValue) {
            return typeof versionValue === 'string' && versionValue.trim()
                ? versionValue.trim()
                : '';
        }

        function getCurrentSavedVersion() {
            return normalizeSavedVersion(currentAppVersion) || 'unknown';
        }

        function getSavedVersionLabel(versionValue) {
            return normalizeSavedVersion(versionValue) || 'old';
        }

        function buildProjectDataDocument(slides = slidesData, settings = projectSettings, projectName = currentProject?.name || settings?.branding?.projectName || 'My Guide') {
            return {
                savedVersion: getCurrentSavedVersion(),
                lastSavedAt: currentProject?.lastSavedAt || '',
                settings: buildProjectSettingsDocument(settings, projectName),
                slides
            };
        }

        function setCurrentProject(project) {
            currentProject = project
                ? {
                    id: project.id,
                    name: project.name || project.meta?.name || project.settings?.branding?.projectName || project.id,
                    savedVersion: normalizeSavedVersion(project.savedVersion || project.meta?.savedVersion),
                    lastSavedAt: project.lastSavedAt || project.meta?.lastSavedAt || project.updatedAt || ''
                }
                : null;
            syncProjectBrandingName(currentProject?.name || projectSettings?.branding?.projectName || 'My Guide');
            updateProjectIndicator();
        }

        function updateProjectIndicator() {
            const indicator = document.getElementById('project-indicator');
            if (!indicator) return;
            indicator.textContent = currentProject
                ? `${currentProject.name}`
                : '프로젝트 없음';
        }

        async function requestJson(url, options = {}) {
            const response = await fetch(url, options);
            let payload = null;

            try {
                payload = await response.json();
            } catch (err) {
                payload = null;
            }

            if (!response.ok) {
                throw new Error(payload?.error || `요청 실패: ${response.status}`);
            }

            return payload;
        }

        async function loadAppVersion() {
            const versionEl = document.getElementById('app-version');
            if (!versionEl) return;

            try {
                const response = await fetch('/version.json', { cache: 'no-store' });
                if (!response.ok) return;

                const payload = await response.json();
                const version = typeof payload?.version === 'string' ? payload.version.trim() : '';
                if (!version) return;

                currentAppVersion = version;
                versionEl.textContent = version;
                versionEl.hidden = false;
            } catch (err) {
                console.warn('[version] 버전 정보를 불러오지 못했습니다:', err);
            }
        }

        async function refreshProjectList() {
            availableProjects = await requestJson('/api/projects');
            return availableProjects;
        }

        async function saveCurrentProjectSelection(projectId) {
            await requestJson('/api/app-state', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentProjectId: projectId })
            });
        }

        function scheduleLegacyImageBackfill(options = {}) {
            if (typeof window.startLegacyImageBackfill !== 'function') {
                return;
            }

            Promise.resolve()
                .then(() => window.startLegacyImageBackfill(options))
                .catch((error) => {
                    console.warn('[legacy-backfill] WebP 변환 예약에 실패했습니다.', error);
                });
        }

        async function loadProjectById(projectId, options = {}) {
            if (typeof window.cancelLegacyImageBackfill === 'function') {
                window.cancelLegacyImageBackfill();
            }

            const project = await requestJson(`/api/projects/${encodeURIComponent(projectId)}`);
            parseLoadedData(project);
            setCurrentProject(project);
            await saveCurrentProjectSelection(project.id);
            await refreshProjectList();
            await loadThemeByName(projectSettings.activeTheme);
            syncBrandingUI();
            activeEditorIndex = slidesData.length === 0 ? 0 : null;
            editingSlideIndex = null;
            window.renderPreview();
            scheduleLegacyImageBackfill({
                persistAfterConversion: true
            });

            if (options.showMessage) {
                showModal(`프로젝트를 불러왔습니다: ${currentProject.name}`);
            }
        }

        async function loadInitialData() {
            try {
                const appState = await requestJson('/api/app-state');
                await refreshProjectList();
                const preferredProjectId = appState.currentProjectId || '';
                const targetProjectId = availableProjects.find((project) => project.id === preferredProjectId)?.id
                    || availableProjects[0]?.id;

                if (!targetProjectId) {
                    throw new Error('불러올 프로젝트가 없습니다.');
                }

                await loadProjectById(targetProjectId);
            } catch (err) {
                console.error('초기 프로젝트를 불러오지 못했습니다.', err);
                slidesData = [];
                projectSettings = getDefaultProjectSettings();
                setCurrentProject(null);
                await loadThemeByName(projectSettings.activeTheme);
                activeEditorIndex = 0;
                window.renderPreview();
                showModal('초기 프로젝트를 불러오지 못했습니다.\n' + err.message);
            }
        }

        window.onload = async function() {
            await Promise.allSettled([
                loadAppVersion(),
                loadInitialData()
            ]);
        };

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

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        function isInlineImageData(imageValue) {
            return typeof imageValue === 'string' && imageValue.startsWith('data:image/');
        }

        function isProjectImagePath(imageValue) {
            return typeof imageValue === 'string' && /^\/api\/projects\/[^/]+\/images\/[^/?#]+$/.test(imageValue.replace(/\\/g, '/'));
        }

        function isLegacyImagePath(imageValue) {
            return typeof imageValue === 'string' && /^\.?\/?data\/image_data\/[^/?#]+$/.test(imageValue.replace(/\\/g, '/'));
        }

        function isRelativeProjectImagePath(imageValue) {
            return typeof imageValue === 'string' && /^\.?\/?image_data\/[^/?#]+$/.test(imageValue.replace(/\\/g, '/'));
        }

        function isStoredImagePath(imageValue) {
            return typeof imageValue === 'string' &&
                !isInlineImageData(imageValue) &&
                (isProjectImagePath(imageValue) || isLegacyImagePath(imageValue) || isRelativeProjectImagePath(imageValue));
        }

        function getSlideImageSrc(imageValue) {
            if (typeof imageValue !== 'string' || imageValue.trim() === '') {
                return null;
            }

            const normalized = imageValue.replace(/\\/g, '/');
            if (isProjectImagePath(normalized)) {
                return normalized;
            }

            if (isRelativeProjectImagePath(normalized)) {
                const fileName = normalized.split('/').pop();
                if (currentProject?.id && fileName) {
                    return `/api/projects/${encodeURIComponent(currentProject.id)}/images/${encodeURIComponent(fileName)}`;
                }
                return normalized;
            }

            return normalized.replace(/^\.?\/?data\/image_data\//, LEGACY_IMAGE_DATA_PREFIX);
        }

        function cloneSlides(slides) {
            return slides.map(slide => Object.assign({}, slide));
        }

        function blobToDataUrl(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        async function fetchImageAsDataUrl(imageValue) {
            const imageSrc = getSlideImageSrc(imageValue);
            if (!imageSrc) return null;
            const response = await fetch(imageSrc);
            if (!response.ok) {
                throw new Error(`이미지 로드 실패: ${imageSrc}`);
            }
            return blobToDataUrl(await response.blob());
        }

        async function buildPortableSlides(slides) {
            const portableSlides = cloneSlides(slides);
            await Promise.all(portableSlides.map(async (slide) => {
                if (!slide || !slide.image || isInlineImageData(slide.image) || !isStoredImagePath(slide.image)) {
                    return;
                }
                slide.image = await fetchImageAsDataUrl(slide.image);
            }));
            return portableSlides;
        }

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
                    if (onConfirm) onConfirm();
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

        window.createProject = async function() {
            const name = window.prompt('새 프로젝트 이름을 입력하세요.', 'My Guide');
            if (!name) return;

            try {
                const created = await requestJson('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, template: 'empty', savedVersion: getCurrentSavedVersion() })
                });
                await loadProjectById(created.id);
                showModal(`새 프로젝트를 만들었습니다: ${created.name}`);
            } catch (err) {
                showModal('새 프로젝트 생성에 실패했습니다.\n' + err.message);
            }
        };

        window.saveAsProject = async function() {
            const suggestedName = currentProject?.name ? `${currentProject.name} Copy` : 'My Guide Copy';
            const name = window.prompt('새 프로젝트 이름을 입력하세요.', suggestedName);
            if (!name) return;

            try {
                const created = await requestJson('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.assign({ name }, buildProjectDataDocument()))
                });
                await loadProjectById(created.id);
                showModal(`다른 이름으로 저장했습니다: ${created.name}`);
            } catch (err) {
                showModal('다른 이름으로 저장에 실패했습니다.\n' + err.message);
            }
        };

        window.openProjectPicker = async function() {
            try {
                const projects = await refreshProjectList();
                if (!projects.length) {
                    showModal('불러올 프로젝트가 없습니다.');
                    return;
                }

                const defaultIndex = Math.max(1, projects.findIndex(project => project.id === currentProject?.id) + 1);
                const promptText = projects.map((project, index) => {
                    const currentMark = project.id === currentProject?.id ? ' [현재]' : '';
                    return `${index + 1}. ${project.name} (${project.slideCount}장)${currentMark}`;
                }).join('\n');

                const selected = window.prompt(`열 프로젝트 번호를 입력하세요.\n\n${promptText}`, String(defaultIndex));
                if (selected === null) return;

                const selectedIndex = Number.parseInt(selected, 10);
                if (!Number.isInteger(selectedIndex) || selectedIndex < 1 || selectedIndex > projects.length) {
                    showModal('올바른 프로젝트 번호를 입력해주세요.');
                    return;
                }

                const targetProject = projects[selectedIndex - 1];
                if (targetProject.id === currentProject?.id) {
                    showModal('이미 열려 있는 프로젝트입니다.');
                    return;
                }

                const shouldOpen = window.confirm(`프로젝트 "${targetProject.name}"을(를) 불러올까요?\n저장되지 않은 변경은 사라질 수 있습니다.`);
                if (!shouldOpen) return;

                await loadProjectById(targetProject.id, { showMessage: true });
            } catch (err) {
                showModal('프로젝트 목록을 불러오지 못했습니다.\n' + err.message);
            }
        };
        // TOC(목차) 데이터를 추출하는 함수
