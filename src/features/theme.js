// Auto-extracted modular segment: Theme Base

function hexToRgbString(value, fallback = '255, 255, 255') {
            const hex = typeof value === 'string' ? value.trim() : '';
            const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : '';
            if (!normalized) return fallback;
            const r = parseInt(normalized.slice(0, 2), 16);
            const g = parseInt(normalized.slice(2, 4), 16);
            const b = parseInt(normalized.slice(4, 6), 16);
            return `${r}, ${g}, ${b}`;
        }

        function shiftHexHue(value, degrees, fallback = '#38bdf8') {
            const hex = typeof value === 'string' ? value.trim() : '';
            const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : '';
            if (!normalized) return fallback;

            const r = parseInt(normalized.slice(0, 2), 16) / 255;
            const g = parseInt(normalized.slice(2, 4), 16) / 255;
            const b = parseInt(normalized.slice(4, 6), 16) / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;

            let h = 0;
            const l = (max + min) / 2;
            const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

            if (delta !== 0) {
                switch (max) {
                    case r:
                        h = 60 * (((g - b) / delta) % 6);
                        break;
                    case g:
                        h = 60 * (((b - r) / delta) + 2);
                        break;
                    default:
                        h = 60 * (((r - g) / delta) + 4);
                        break;
                }
            }

            const hue = ((h + degrees) % 360 + 360) % 360;
            const chroma = (1 - Math.abs(2 * l - 1)) * s;
            const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
            const m = l - chroma / 2;

            let rr = 0;
            let gg = 0;
            let bb = 0;

            if (hue < 60) {
                rr = chroma; gg = x; bb = 0;
            } else if (hue < 120) {
                rr = x; gg = chroma; bb = 0;
            } else if (hue < 180) {
                rr = 0; gg = chroma; bb = x;
            } else if (hue < 240) {
                rr = 0; gg = x; bb = chroma;
            } else if (hue < 300) {
                rr = x; gg = 0; bb = chroma;
            } else {
                rr = chroma; gg = 0; bb = x;
            }

            const toHex = (channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
            return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
        }

        function deriveSecondaryAccent(accentValue, isDarkMode = true) {
            return shiftHexHue(
                accentValue,
                isDarkMode ? 26 : -18,
                isDarkMode ? '#38bdf8' : '#0ea5e9'
            );
        }

        function clampGlassValue(value, min, max, fallback) {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) return fallback;
            return Math.min(max, Math.max(min, numeric));
        }

        function getDefaultGlassSettings(isDarkMode = true) {
            if (isDarkMode) {
                return {
                    backgroundColor: '#FFFFFF',
                    backgroundAlpha: 0.20,
                    backgroundBlur: 22,
                    backgroundSaturation: 150,
                    refraction: 0.06,
                    depth: 0.05
                };
            }

            return {
                backgroundColor: '#FFFFFF',
                backgroundAlpha: 0.34,
                backgroundBlur: 11,
                backgroundSaturation: 118,
                refraction: 0.08,
                depth: 0.12
            };
        }

        function getBaseThemeTemplate() {
            return {
                name: 'hpe_default',
                displayName: 'HPE Default (Dark)',
                version: '1.0',
                isDarkMode: true,
                colors: {
                    accent:   '#00E676',
                    secondaryAccent: '#14b8a6',
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

        function normalizeThemeObject(theme) {
            const baseTheme = getBaseThemeTemplate();
            const safeTheme = theme && typeof theme === 'object' ? theme : {};
            const isDarkMode = safeTheme.isDarkMode !== false;
            const defaultGlass = getDefaultGlassSettings(isDarkMode);
            const rawGlass = safeTheme.glass && typeof safeTheme.glass === 'object' ? safeTheme.glass : {};

            return {
                name: safeTheme.name || baseTheme.name,
                displayName: safeTheme.displayName || safeTheme.name || baseTheme.displayName,
                version: safeTheme.version || baseTheme.version,
                isDarkMode,
                colors: Object.assign({}, baseTheme.colors, safeTheme.colors || {}, {
                    secondaryAccent: /^#[0-9a-fA-F]{6}$/.test(safeTheme?.colors?.secondaryAccent || '')
                        ? safeTheme.colors.secondaryAccent
                        : deriveSecondaryAccent((safeTheme?.colors?.accent || baseTheme.colors.accent), isDarkMode)
                }),
                webGuide: Object.assign({}, baseTheme.webGuide, safeTheme.webGuide || {}),
                fonts: Object.assign({}, baseTheme.fonts, safeTheme.fonts || {}),
                glass: {
                    backgroundColor: /^#[0-9a-fA-F]{6}$/.test(rawGlass.backgroundColor || '')
                        ? rawGlass.backgroundColor
                        : defaultGlass.backgroundColor,
                    backgroundAlpha: clampGlassValue(rawGlass.backgroundAlpha, 0.04, 0.42, defaultGlass.backgroundAlpha),
                    backgroundBlur: clampGlassValue(rawGlass.backgroundBlur, 0, 40, defaultGlass.backgroundBlur),
                    backgroundSaturation: clampGlassValue(rawGlass.backgroundSaturation, 80, 220, defaultGlass.backgroundSaturation),
                    refraction: clampGlassValue(rawGlass.refraction, 0, 0.4, defaultGlass.refraction),
                    depth: clampGlassValue(rawGlass.depth, 0, 1, defaultGlass.depth)
                }
            };
        }

        const GLASS_FIELD_DEFINITIONS = [
            { key: 'backgroundAlpha', label: '배경 투명도', min: 0.04, max: 0.42, step: 0.01 },
            { key: 'backgroundBlur', label: '배경 블러', min: 0, max: 40, step: 1, unit: 'px' },
            { key: 'backgroundSaturation', label: '배경 채도', min: 80, max: 220, step: 1, unit: '%' },
            { key: 'refraction', label: '굴절', min: 0, max: 0.4, step: 0.01 },
            { key: 'depth', label: '깊이', min: 0, max: 1, step: 0.01 }
        ];

        function getDefaultThemeObject() {
            return normalizeThemeObject(getBaseThemeTemplate());
        }

        // 에디터 CSS 변수를 테마로 교체
        function applyThemeToEditor(theme) {
            const normalizedTheme = normalizeThemeObject(theme);
            if (!normalizedTheme || !normalizedTheme.colors) return;
            const root = document.documentElement.style;
            root.setProperty('--hpe-green', normalizedTheme.colors.accent);
            root.setProperty('--hpe-green-alpha', normalizedTheme.colors.accent + '14');
            root.setProperty('--secondary-accent', normalizedTheme.colors.secondaryAccent || deriveSecondaryAccent(normalizedTheme.colors.accent, normalizedTheme.isDarkMode !== false));
            root.setProperty('--accent-glow', shiftHexHue(normalizedTheme.colors.accent, normalizedTheme.isDarkMode ? -10 : 14, normalizedTheme.colors.accent));
            root.setProperty('--code-color', normalizedTheme.colors.codeColor || normalizedTheme.colors.accent);
            root.setProperty('--code-bg', (normalizedTheme.colors.codeColor || normalizedTheme.colors.accent) + '1A');
            root.setProperty('--bg-dark', normalizedTheme.colors.bgDark);
            root.setProperty('--slide-bg', normalizedTheme.colors.slideBg);
            root.setProperty('--box-bg', normalizedTheme.colors.boxBg);
            root.setProperty('--border-color', normalizedTheme.colors.border);
            root.setProperty('--text-main', normalizedTheme.colors.textMain);
            root.setProperty('--text-dim', normalizedTheme.colors.textDim);

            const glass = normalizedTheme.glass;
            root.setProperty('--glass-rgb', hexToRgbString(glass.backgroundColor));
            root.setProperty('--glass-alpha', glass.backgroundAlpha.toFixed(2));
            root.setProperty('--glass-blur', `${glass.backgroundBlur}px`);
            root.setProperty('--glass-saturation', `${glass.backgroundSaturation}%`);
            root.setProperty('--glass-refraction', glass.refraction.toFixed(2));
            root.setProperty('--glass-depth', glass.depth.toFixed(2));

            const borderAlpha = normalizedTheme.isDarkMode
                ? 0.10 + (glass.refraction * 0.22)
                : 0.24 + (glass.refraction * 0.72);
            const shadowAlpha = normalizedTheme.isDarkMode
                ? 0.04 + (glass.depth * 0.06)
                : 0.05 + (glass.depth * 0.10);
            const highlightAlpha = normalizedTheme.isDarkMode
                ? 0.07 + (glass.refraction * 0.12)
                : 0.24 + (glass.refraction * 0.42);

            root.setProperty('--glass-border-alpha', borderAlpha.toFixed(2));
            root.setProperty('--glass-shadow-alpha', shadowAlpha.toFixed(2));
            root.setProperty('--glass-highlight-alpha', highlightAlpha.toFixed(2));

            if (normalizedTheme.isDarkMode !== false) {
                document.body.classList.remove('light-mode');
            } else {
                document.body.classList.add('light-mode');
            }

            activeTheme = normalizedTheme;
            projectSettings.activeTheme = normalizedTheme.name;
        }

        // 테마 이름으로 서버에서 불러와 적용 (실패 시 기본 테마 폴백)
        async function loadThemeByName(name) {
            try {
                const filename = name.endsWith('.slidetheme') ? name : name + '.slidetheme';
                const res = await fetch('/api/themes/' + filename);
                if (res.ok) {
                    const theme = normalizeThemeObject(await res.json());
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
                    const theme = normalizeThemeObject(JSON.parse(e.target.result));
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
                { key: 'secondaryAccent', label: '보조 강조색 (Secondary Accent)' },
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

            const glassEl = document.getElementById('theme-glass-editor');
            if (glassEl) {
                const glass = t.glass || getDefaultThemeObject().glass;
                glassEl.innerHTML = `
                    <div class="theme-glass-color-row">
                        <span class="color-row-label">배경 색상</span>
                        <input type="color" id="glass-backgroundColor" value="${glass.backgroundColor}"
                            oninput="document.getElementById('glass-backgroundColor-hex').value=this.value; window.applyGlassPreview()">
                        <input type="text" id="glass-backgroundColor-hex" value="${glass.backgroundColor}" maxlength="7" class="hex-input"
                            oninput="window.syncGlassColorFromHex()">
                    </div>
                    ${GLASS_FIELD_DEFINITIONS.map(({ key, label, min, max, step, unit = '' }) => `
                        <div class="theme-glass-row">
                            <label class="theme-glass-row-label" for="glass-${key}-range">${label}</label>
                            <input type="range" id="glass-${key}-range" min="${min}" max="${max}" step="${step}" value="${glass[key]}"
                                oninput="window.syncGlassControl('${key}', 'range')">
                            <input type="number" id="glass-${key}-number" min="${min}" max="${max}" step="${step}" value="${glass[key]}"
                                oninput="window.syncGlassControl('${key}', 'number')">
                            <span class="theme-glass-unit">${unit}</span>
                        </div>
                    `).join('')}
                `;
            }

            updateThemeGlassSample(t);
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

            const keys = ['accent','secondaryAccent','codeColor','bgDark','slideBg','boxBg','border','textMain','textDim'];
            keys.forEach(key => {
                const hexEl = document.getElementById('hex-' + key);
                if (hexEl && /^#[0-9a-fA-F]{6}$/.test(hexEl.value)) {
                    const map = {
                        accent: '--hpe-green', secondaryAccent: '--secondary-accent', codeColor: '--code-color', bgDark: '--bg-dark', slideBg: '--slide-bg',
                        boxBg: '--box-bg', border: '--border-color', textMain: '--text-main', textDim: '--text-dim'
                    };
                    document.documentElement.style.setProperty(map[key], hexEl.value);
                    if (key === 'codeColor' || (key === 'accent' && !document.getElementById('hex-codeColor'))) {
                        document.documentElement.style.setProperty('--code-bg', hexEl.value + '1A');
                    }
                }
            });

            window.applyGlassPreview();
        };

        function getThemeGlassFromModal() {
            const theme = activeTheme || getDefaultThemeObject();
            const fallback = getDefaultGlassSettings(document.getElementById('theme-is-dark')?.checked !== false);
            const currentGlass = theme.glass || fallback;

            const colorInput = document.getElementById('glass-backgroundColor-hex');
            const colorValue = colorInput?.value?.trim();

            return {
                backgroundColor: /^#[0-9a-fA-F]{6}$/.test(colorValue || '')
                    ? colorValue
                    : currentGlass.backgroundColor,
                backgroundAlpha: clampGlassValue(document.getElementById('glass-backgroundAlpha-number')?.value, 0.04, 0.42, currentGlass.backgroundAlpha),
                backgroundBlur: clampGlassValue(document.getElementById('glass-backgroundBlur-number')?.value, 0, 40, currentGlass.backgroundBlur),
                backgroundSaturation: clampGlassValue(document.getElementById('glass-backgroundSaturation-number')?.value, 80, 220, currentGlass.backgroundSaturation),
                refraction: clampGlassValue(document.getElementById('glass-refraction-number')?.value, 0, 0.4, currentGlass.refraction),
                depth: clampGlassValue(document.getElementById('glass-depth-number')?.value, 0, 1, currentGlass.depth)
            };
        }

        function updateThemeGlassSample(theme) {
            const sample = document.getElementById('theme-glass-sample');
            if (!sample) return;

            const normalizedTheme = normalizeThemeObject(theme);
            const glass = normalizedTheme.glass;
            sample.classList.toggle('light-mode', normalizedTheme.isDarkMode === false);
            sample.style.setProperty('--sample-glass-rgb', hexToRgbString(glass.backgroundColor));
            sample.style.setProperty('--sample-glass-alpha', glass.backgroundAlpha.toFixed(2));
            sample.style.setProperty('--sample-glass-blur', `${glass.backgroundBlur}px`);
            sample.style.setProperty('--sample-glass-saturation', `${glass.backgroundSaturation}%`);
            sample.style.setProperty('--sample-glass-refraction', glass.refraction.toFixed(2));
            sample.style.setProperty('--sample-glass-depth', glass.depth.toFixed(2));
            sample.style.setProperty('--sample-accent', normalizedTheme.colors.accent);
            sample.style.setProperty('--sample-bg-dark', normalizedTheme.colors.bgDark);
            sample.style.setProperty('--sample-slide-bg', normalizedTheme.colors.slideBg);
            sample.style.setProperty('--sample-box-bg', normalizedTheme.colors.boxBg);
            sample.style.setProperty('--sample-border', normalizedTheme.colors.border);
            sample.style.setProperty('--sample-text-main', normalizedTheme.colors.textMain);
            sample.style.setProperty('--sample-text-dim', normalizedTheme.colors.textDim);
        }

        window.syncGlassColorFromHex = function() {
            const hexEl = document.getElementById('glass-backgroundColor-hex');
            const pickerEl = document.getElementById('glass-backgroundColor');
            if (!hexEl || !pickerEl) return;
            const val = hexEl.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                pickerEl.value = val;
                window.applyGlassPreview();
            }
        };

        window.syncGlassControl = function(key, source) {
            const rangeEl = document.getElementById(`glass-${key}-range`);
            const numberEl = document.getElementById(`glass-${key}-number`);
            if (!rangeEl || !numberEl) return;
            if (source === 'range') {
                numberEl.value = rangeEl.value;
            } else {
                rangeEl.value = numberEl.value;
            }
            window.applyGlassPreview();
        };

        window.applyGlassPreview = function() {
            const theme = buildThemeFromModal();
            applyThemeToEditor(theme);
            updateThemeGlassSample(theme);
        };

        function buildThemeFromModal() {
            const keys = ['accent','secondaryAccent','codeColor','bgDark','slideBg','boxBg','border','textMain','textDim'];
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

            return normalizeThemeObject({
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
                fonts: t.fonts || getDefaultThemeObject().fonts,
                glass: getThemeGlassFromModal()
            });
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
