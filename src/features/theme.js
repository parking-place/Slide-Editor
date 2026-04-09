// Auto-extracted modular segment: Theme Base

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
                webGuide: {
                    headerBg:    '#01a982',
                    accentColor: '#01a982',
                    darkAccent:  '#00e676',
                    codeColor:   '#00e676'
                },
                fonts: {
                    uiFamily:   'Pretendard',
                    codeFamily: 'D2Coding'
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
            applyThemeToEditor(getDefaultThemeObject());
        }

        window.loadThemeList = async function() {
            try {
                const res = await fetch('/api/themes');
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('[테마] 목록 로드 실패:', e);
            }
            return [];
        };

        window.loadTheme = async function(filename) {
            await loadThemeByName(filename.replace('.slidetheme', ''));
            renderThemeModal();
        };

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

        function syncBrandingUI() {
            syncProjectBrandingName(currentProject?.name || projectSettings.branding.projectName || 'My Guide');
            const nameDisplay = document.getElementById('project-branding-name-display');
            const guideSubtitleInput = document.getElementById('project-branding-guide-subtitle');
            const footerCopyInput = document.getElementById('project-branding-footer-copy');
            if (nameDisplay) nameDisplay.textContent = projectSettings.branding.projectName;
            if (guideSubtitleInput) guideSubtitleInput.value = projectSettings.branding.guideSubtitle;
            if (footerCopyInput) footerCopyInput.value = projectSettings.branding.footerCopy;
        }

        function collectBrandingFromUI() {
            syncProjectBrandingName(currentProject?.name || projectSettings.branding.projectName || 'My Guide');
            const guideSubtitleInput = document.getElementById('project-branding-guide-subtitle');
            const footerCopyInput = document.getElementById('project-branding-footer-copy');
            if (guideSubtitleInput) {
                projectSettings.branding.guideSubtitle = guideSubtitleInput.value.trim() || projectSettings.branding.guideSubtitle;
            }
            if (footerCopyInput) {
                projectSettings.branding.footerCopy = footerCopyInput.value.trim() || projectSettings.branding.footerCopy;
            }
        }

        window.updateProjectBrandingDraft = function() {
            collectBrandingFromUI();
            if (typeof window.renderPreview === 'function') {
                window.renderPreview();
            }
        };

        function renderThemeModal() {
            const modal = document.getElementById('theme-modal');
            if (!modal) return;
            const t = activeTheme || getDefaultThemeObject();

            window.loadThemeList().then(files => {
                const listEl = document.getElementById('theme-list-items');
                if (!listEl) return;
                listEl.innerHTML = files.map(f => {
                    const n = f.replace('.slidetheme', '');
                    const active = n === (t.name || '') ? 'active' : '';
                    return `<div class="theme-list-item ${active}" onclick="window.loadTheme('${f}')">${n}</div>`;
                }).join('');
            });

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

            const nameEl = document.getElementById('theme-name-input');
            if (nameEl) nameEl.value = t.name || '';

            const darkEl = document.getElementById('theme-is-dark');
            if (darkEl) darkEl.checked = t.isDarkMode !== false;

            syncBrandingUI();
        }

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

        function buildThemeFromModal() {
            const keys = ['accent','codeColor','bgDark','slideBg','boxBg','border','textMain','textDim'];
            const colors = {};
            keys.forEach(k => {
                const hexEl = document.getElementById('hex-' + k);
                colors[k] = (hexEl && /^#[0-9a-fA-F]{6}$/.test(hexEl.value))
                    ? hexEl.value : (activeTheme && activeTheme.colors[k] || '#000000');
            });

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
                webGuide: {
                    headerBg:    colors.accent,
                    accentColor: colors.accent,
                    darkAccent:  colors.accent,
                    codeColor:   colors.codeColor || colors.accent
                },
                fonts: t.fonts || getDefaultThemeObject().fonts
            };
        }

        window.applyThemeFromModal = function() {
            const theme = buildThemeFromModal();
            applyThemeToEditor(theme);
            showModal('테마가 적용되었습니다!');
        };

        window.saveThemeFromModal = async function() {
            const theme = buildThemeFromModal();
            applyThemeToEditor(theme);
            const ok = await window.saveThemeToServer(theme);
            if (ok) {
                renderThemeModal();
                showModal('테마를 서버에 저장했습니다: ' + theme.name + '.slidetheme');
            } else {
                showModal('서버 저장에 실패했습니다. 테마 내보내기를 이용해 수동 저장하세요.');
            }
        };

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

        // 브랜딩 설정은 프로젝트 매니저로 통합되었습니다.
        window.openBrandingModal = function() {
            window.openProjectModal('open');
        };

        window.closeBrandingModal = function() {
            const modal = document.getElementById('branding-modal');
            if (modal) modal.style.display = 'none';
        };

        window.applyBrandingFromModal = function() {
            collectBrandingFromUI();
            window.closeBrandingModal();
            if (typeof window.renderPreview === 'function') {
                window.renderPreview();
            }
        };
