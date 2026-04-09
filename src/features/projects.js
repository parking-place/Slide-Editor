// Auto-extracted modular segment: Projects Base

function getProjectModalDefaultName(mode) {
            if (mode === 'saveAs') {
                return currentProject?.name ? `${currentProject.name} Copy` : 'My Guide Copy';
            }
            if (mode === 'new') {
                return currentProject?.name || projectSettings?.branding?.projectName || 'My Guide';
            }
            return '';
        }

        function ensureProjectModalSelection() {
            if (!availableProjects.length) {
                projectModalState.selectedProjectId = null;
                return;
            }

            const stillExists = availableProjects.some(project => project.id === projectModalState.selectedProjectId);
            if (stillExists) return;

            projectModalState.selectedProjectId = currentProject?.id || availableProjects[0].id;
        }

        function getSelectedProjectFromModal() {
            ensureProjectModalSelection();
            return availableProjects.find(project => project.id === projectModalState.selectedProjectId) || null;
        }

        function buildProjectListMarkup() {
            if (!availableProjects.length) {
                return '<div class="project-empty-state">No saved projects yet. Create your first project from the New tab.</div>';
            }

            return availableProjects.map(project => {
                const isActive = project.id === projectModalState.selectedProjectId;
                const isCurrent = project.id === currentProject?.id;
                const slideCount = Number.isFinite(project.slideCount) ? project.slideCount : 0;
                const versionLabel = getSavedVersionLabel(project.savedVersion);
                return `
                    <div class="project-list-item ${isActive ? 'active' : ''}" onclick="window.selectProjectModalProject('${project.id}')">
                        <div class="project-list-item-name">${escapeHtml(project.name || project.id)}</div>
                        <div class="project-list-item-meta">${slideCount} slides / ${escapeHtml(project.id)} / ${escapeHtml(versionLabel)}</div>
                        ${isCurrent ? '<span class="project-badge"><i class="fa-solid fa-circle-check"></i> Current</span>' : ''}
                    </div>
                `;
            }).join('');
        }

        function renderProjectModal() {
            const modal = document.getElementById('project-modal');
            if (!modal) return;

            ensureProjectModalSelection();

            const selectedProject = getSelectedProjectFromModal();
            const mode = projectModalState.mode;
            const currentNameEl = document.getElementById('project-modal-current-name');
            const currentMetaEl = document.getElementById('project-modal-current-meta');
            const listEl = document.getElementById('project-list-items');
            const inputEl = document.getElementById('project-modal-name-input');
            const inputLabelEl = document.getElementById('project-modal-name-label');
            const helpEl = document.getElementById('project-modal-help');
            const selectionEl = document.getElementById('project-modal-selection');
            const primaryBtn = document.getElementById('project-modal-primary-btn');

            if (currentNameEl) {
                currentNameEl.textContent = currentProject?.name || 'No project opened';
            }

            if (currentMetaEl) {
                currentMetaEl.textContent = currentProject
                    ? `${currentProject.id} / ${slidesData.length} slides currently loaded / ${getSavedVersionLabel(currentProject.savedVersion)}`
                    : 'Start from a new project or open an existing one.';
            }

            syncBrandingUI();

            if (listEl) {
                listEl.innerHTML = buildProjectListMarkup();
            }

            ['open', 'new', 'saveAs', 'rename', 'delete'].forEach(modeName => {
                const buttonId = modeName === 'saveAs' ? 'project-mode-saveas' : `project-mode-${modeName}`;
                const button = document.getElementById(buttonId);
                if (!button) return;
                button.classList.toggle('active', modeName === mode);
                button.disabled = projectModalState.isSubmitting;
            });

            if (inputEl) {
                inputEl.disabled = mode === 'open' || mode === 'delete' || projectModalState.isSubmitting;
                inputEl.value = mode === 'open' || mode === 'delete'
                    ? (selectedProject?.name || '')
                    : (projectModalState.nameDraft || '');
                inputEl.placeholder = mode === 'saveAs' ? 'My Guide Copy' : (mode === 'rename' ? 'Rename project' : 'My Guide');
            }

            if (inputLabelEl) {
                inputLabelEl.textContent = mode === 'new'
                    ? 'New Project Name'
                    : mode === 'saveAs'
                        ? 'Save As Project Name'
                        : mode === 'rename'
                            ? 'Rename Selected Project'
                            : mode === 'delete'
                                ? 'Project to Delete'
                                : 'Project to Open';
            }

            if (helpEl) {
                helpEl.textContent = mode === 'new'
                    ? 'Create a clean project without touching the currently opened project.'
                    : mode === 'saveAs'
                        ? 'Duplicate the current editor state into a brand new saved project.'
                        : mode === 'rename'
                            ? 'Update the display name of the selected project while keeping its project id the same.'
                            : mode === 'delete'
                                ? 'Delete the selected project and its saved slide data. If the current project is deleted, the next available project will open automatically.'
                                : 'Choose a saved project from the list to load it into the editor.';
            }

            if (selectionEl) {
                if (!selectedProject) {
                    selectionEl.classList.add('is-empty');
                    selectionEl.innerHTML = 'Select a project from the list.';
                } else if (mode === 'open') {
                    selectionEl.classList.remove('is-empty');
                    selectionEl.innerHTML = `
                        <span class="project-badge"><i class="fa-solid ${selectedProject.id === currentProject?.id ? 'fa-circle-check' : 'fa-folder-open'}"></i> ${selectedProject.id === currentProject?.id ? 'Already open' : 'Ready to open'}</span>
                        <strong>${escapeHtml(selectedProject.name || selectedProject.id)}</strong>
                        <span>${escapeHtml(selectedProject.id)} / ${selectedProject.slideCount || 0} slides / ${escapeHtml(getSavedVersionLabel(selectedProject.savedVersion))}</span>
                    `;
                } else if (mode === 'rename') {
                    selectionEl.classList.remove('is-empty');
                    selectionEl.innerHTML = `
                        <span class="project-badge"><i class="fa-solid fa-pen"></i> Rename target</span>
                        <strong>${escapeHtml(selectedProject.name || selectedProject.id)}</strong>
                        <span>${escapeHtml(selectedProject.id)} / ${selectedProject.slideCount || 0} slides / ${escapeHtml(getSavedVersionLabel(selectedProject.savedVersion))}</span>
                    `;
                } else if (mode === 'delete') {
                    selectionEl.classList.remove('is-empty');
                    selectionEl.innerHTML = `
                        <span class="project-badge"><i class="fa-solid fa-trash"></i> Delete target</span>
                        <strong>${escapeHtml(selectedProject.name || selectedProject.id)}</strong>
                        <span>${escapeHtml(selectedProject.id)} / ${selectedProject.slideCount || 0} slides / ${escapeHtml(getSavedVersionLabel(selectedProject.savedVersion))}</span>
                    `;
                } else {
                    selectionEl.classList.remove('is-empty');
                    selectionEl.innerHTML = `
                        <span class="project-badge"><i class="fa-solid fa-layer-group"></i> Source</span>
                        <strong>${escapeHtml(currentProject?.name || 'Current editor state')}</strong>
                        <span>${slidesData.length} slides and the current branding/theme settings will be copied.</span>
                    `;
                }
            }

            if (primaryBtn) {
                const label = mode === 'new'
                    ? 'Create Project'
                    : mode === 'saveAs'
                        ? 'Save As New Project'
                        : mode === 'rename'
                            ? 'Rename Project'
                            : mode === 'delete'
                                ? 'Delete Project'
                                : 'Open Selected Project';
                const iconClass = mode === 'new'
                    ? 'fa-folder-plus'
                    : mode === 'saveAs'
                        ? 'fa-copy'
                        : mode === 'rename'
                            ? 'fa-pen'
                            : mode === 'delete'
                                ? 'fa-trash'
                                : 'fa-folder-open';
                primaryBtn.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${label}`;
                primaryBtn.disabled = projectModalState.isSubmitting
                    || (mode === 'open' && (!selectedProject || selectedProject.id === currentProject?.id))
                    || ((mode === 'rename' || mode === 'delete') && !selectedProject);
            }
        }

        window.setProjectModalNameDraft = function(value) {
            projectModalState.nameDraft = value;
        };

        window.selectProjectModalProject = function(projectId) {
            projectModalState.selectedProjectId = projectId;
            if (projectModalState.mode === 'rename') {
                const selectedProject = getSelectedProjectFromModal();
                projectModalState.nameDraft = selectedProject?.name || '';
            }
            renderProjectModal();
        };

        window.setProjectModalMode = function(mode) {
            projectModalState.mode = mode;
            if (mode === 'rename') {
                const selectedProject = getSelectedProjectFromModal();
                projectModalState.nameDraft = selectedProject?.name || '';
            } else {
                projectModalState.nameDraft = getProjectModalDefaultName(mode);
            }
            renderProjectModal();
        };

        window.openProjectModal = async function(mode = 'open') {
            const modal = document.getElementById('project-modal');
            if (!modal) return;

            projectModalState.mode = mode;
            projectModalState.isSubmitting = false;

            try {
                await refreshProjectList();
                projectModalState.selectedProjectId = currentProject?.id || availableProjects[0]?.id || null;
                projectModalState.nameDraft = mode === 'rename'
                    ? (getSelectedProjectFromModal()?.name || '')
                    : getProjectModalDefaultName(mode);
                modal.style.display = 'flex';
                renderProjectModal();
            } catch (err) {
                showModal('Failed to load project list.\n' + err.message);
            }
        };

        window.closeProjectModal = function() {
            const modal = document.getElementById('project-modal');
            if (modal) modal.style.display = 'none';
        };

        window.refreshProjectModalList = async function() {
            try {
                await refreshProjectList();
                ensureProjectModalSelection();
                renderProjectModal();
            } catch (err) {
                showModal('Failed to refresh project list.\n' + err.message);
            }
        };

        window.submitProjectModalAction = async function() {
            if (projectModalState.isSubmitting) return;

            const mode = projectModalState.mode;
            const selectedProject = getSelectedProjectFromModal();
            const name = (projectModalState.nameDraft || '').trim();

            if ((mode === 'new' || mode === 'saveAs' || mode === 'rename') && !name) {
                showModal('Enter a project name first.');
                return;
            }

            if ((mode === 'open' || mode === 'rename' || mode === 'delete') && !selectedProject) {
                showModal('Choose a project from the list first.');
                return;
            }

            if (mode === 'delete') {
                showModal(`Delete project "${selectedProject.name}"?\nThis will remove its saved data.`, true, async () => {
                    try {
                        projectModalState.isSubmitting = true;
                        renderProjectModal();
                        const deleted = await requestJson(`/api/projects/${encodeURIComponent(selectedProject.id)}`, {
                            method: 'DELETE'
                        });
                        await refreshProjectList();
                        if (deleted.currentProjectId) {
                            await loadProjectById(deleted.currentProjectId);
                        }
                        window.closeProjectModal();
                        showModal(`Deleted project: ${selectedProject.name}`);
                    } catch (err) {
                        showModal('Failed to delete the selected project.\n' + err.message);
                    } finally {
                        projectModalState.isSubmitting = false;
                        renderProjectModal();
                    }
                });
                return;
            }

            projectModalState.isSubmitting = true;
            renderProjectModal();

            try {
                if (mode === 'new') {
                    const created = await requestJson('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, template: 'empty', savedVersion: getCurrentSavedVersion() })
                    });
                    await loadProjectById(created.id);
                    window.closeProjectModal();
                    showModal(`Created a new project: ${created.name}`);
                    return;
                }

                if (mode === 'saveAs') {
                    const created = await requestJson('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(Object.assign({ name }, buildProjectDataDocument(slidesData, projectSettings, name)))
                    });
                    await loadProjectById(created.id);
                    window.closeProjectModal();
                    showModal(`Saved as a new project: ${created.name}`);
                    return;
                }

                if (mode === 'rename') {
                    const renamed = await requestJson(`/api/projects/${encodeURIComponent(selectedProject.id)}/meta`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name })
                    });
                    await refreshProjectList();
                    if (selectedProject.id === currentProject?.id) {
                        currentProject = {
                            id: selectedProject.id,
                            name: renamed.project.name,
                            savedVersion: normalizeSavedVersion(renamed.project.savedVersion)
                        };
                        syncProjectBrandingName(renamed.project.name);
                        updateProjectIndicator();
                        window.renderPreview();
                    }
                    projectModalState.nameDraft = renamed.project.name;
                    renderProjectModal();
                    showModal(`Renamed project: ${renamed.project.name}`);
                    return;
                }

                if (selectedProject.id === currentProject?.id) {
                    showModal('That project is already open.');
                    return;
                }

                await loadProjectById(selectedProject.id, { showMessage: true });
                window.closeProjectModal();
            } catch (err) {
                const prefix = mode === 'new'
                    ? 'Failed to create a new project.\n'
                    : mode === 'saveAs'
                        ? 'Failed to save as a new project.\n'
                        : mode === 'rename'
                            ? 'Failed to rename the selected project.\n'
                            : mode === 'delete'
                                ? 'Failed to delete the selected project.\n'
                                : 'Failed to open the selected project.\n';
                showModal(prefix + err.message);
            } finally {
                projectModalState.isSubmitting = false;
                renderProjectModal();
            }
        };

        window.createProject = function() {
            window.openProjectModal('new');
        };

        window.saveAsProject = function() {
            window.openProjectModal('saveAs');
        };

        window.openProjectPicker = function() {
            window.openProjectModal('open');
        };
