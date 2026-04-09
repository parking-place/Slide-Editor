// Auto-extracted modular segment: Projects Base

function ensureProjectModalSelection() {
    if (!availableProjects.length) {
        projectModalState.selectedProjectId = null;
        return;
    }

    const stillExists = availableProjects.some((project) => project.id === projectModalState.selectedProjectId);
    if (stillExists) return;

    projectModalState.selectedProjectId = currentProject?.id || availableProjects[0].id;
}

function getSelectedProjectFromModal() {
    ensureProjectModalSelection();
    return availableProjects.find((project) => project.id === projectModalState.selectedProjectId) || null;
}

function getProjectModalDetails(projectId) {
    if (!projectId) return null;

    if (currentProject?.id === projectId) {
        return {
            id: currentProject.id,
            name: currentProject.name,
            savedVersion: currentProject.savedVersion,
            lastSavedAt: currentProject.lastSavedAt || '',
            slideCount: slidesData.length,
            settings: projectSettings,
            slides: slidesData
        };
    }

    if (projectModalState.selectedProjectDataId === projectId) {
        return projectModalState.selectedProjectData;
    }

    return null;
}

function buildProjectModalMetaLine(projectDetails, slideCountOverride) {
    if (!projectDetails) {
        return 'No project selected';
    }

    const slideCount = Number.isFinite(slideCountOverride)
        ? slideCountOverride
        : (Number.isFinite(projectDetails.slideCount) ? projectDetails.slideCount : Array.isArray(projectDetails.slides) ? projectDetails.slides.length : 0);

    return `${projectDetails.id} / ${slideCount} page / ${getSavedVersionLabel(projectDetails.savedVersion)}`;
}

function getProjectLastSavedLabel(projectDetails) {
    const lastSavedAt = projectDetails?.lastSavedAt || projectDetails?.meta?.lastSavedAt || projectDetails?.updatedAt || '';
    return (typeof lastSavedAt === 'string' && lastSavedAt.trim()) ? lastSavedAt.trim() : 'NoData';
}

function buildProjectListMeta(project) {
    const slideCount = Number.isFinite(project.slideCount) ? project.slideCount : 0;
    const versionLabel = getSavedVersionLabel(project.savedVersion);
    return `${project.id} / ${slideCount} page / ${versionLabel}`;
}

function buildProjectMetaMarkup(projectDetails, slideCountOverride) {
    if (!projectDetails) {
        return '<div class="project-meta-empty">No project selected</div>';
    }

    const slideCount = Number.isFinite(slideCountOverride)
        ? slideCountOverride
        : (Number.isFinite(projectDetails.slideCount) ? projectDetails.slideCount : Array.isArray(projectDetails.slides) ? projectDetails.slides.length : 0);

    const items = [
        { label: 'ID', value: projectDetails.id || '-' },
        { label: 'page', value: `${slideCount} page` },
        { label: 'Saved Version', value: getSavedVersionLabel(projectDetails.savedVersion) },
        { label: 'Last Saved', value: getProjectLastSavedLabel(projectDetails) }
    ];

    return `
        <div class="project-meta-grid">
            ${items.map((item) => `
                <div class="project-meta-item">
                    <span class="project-meta-label">${escapeHtml(item.label)}</span>
                    <span class="project-meta-value">${escapeHtml(item.value)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function getCopySourceDetails(projectId) {
    return getProjectModalDetails(projectId) || availableProjects.find((project) => project.id === projectId) || null;
}

function getUniqueCopyProjectName(projectName, projects = availableProjects) {
    const baseName = normalizeProjectName(projectName, 'My Guide');
    const copyStem = `${baseName}_copy`;
    const usedKeys = new Set(
        (Array.isArray(projects) ? projects : [])
            .flatMap((project) => [project?.name, project?.id])
            .filter(Boolean)
            .map(normalizeProjectNameConflictKey)
    );

    let candidateName = copyStem;
    let suffix = 2;
    while (usedKeys.has(normalizeProjectNameConflictKey(candidateName))) {
        candidateName = `${copyStem}${suffix}`;
        suffix += 1;
    }

    return candidateName;
}

function resetNewProjectDraft() {
    const baseName = 'My Guide';
    const defaultSettings = getDefaultProjectSettings(baseName);
    projectModalState.newProjectDraft = {
        name: baseName,
        subtitle: defaultSettings.branding.guideSubtitle,
        footer: defaultSettings.branding.footerCopy
    };
}

function renderNewProjectDialog() {
    const nameInput = document.getElementById('new-project-name-input');
    const subtitleInput = document.getElementById('new-project-subtitle-input');
    const footerInput = document.getElementById('new-project-footer-input');
    const createBtn = document.getElementById('new-project-create-btn');
    const importBtn = document.getElementById('new-project-import-btn');

    if (nameInput) {
        nameInput.value = projectModalState.newProjectDraft.name || '';
        nameInput.disabled = projectModalState.isNewProjectSubmitting;
    }
    if (subtitleInput) {
        subtitleInput.value = projectModalState.newProjectDraft.subtitle || '';
        subtitleInput.disabled = projectModalState.isNewProjectSubmitting;
    }
    if (footerInput) {
        footerInput.value = projectModalState.newProjectDraft.footer || '';
        footerInput.disabled = projectModalState.isNewProjectSubmitting;
    }
    if (createBtn) {
        createBtn.disabled = projectModalState.isNewProjectSubmitting;
    }
    if (importBtn) {
        importBtn.disabled = projectModalState.isNewProjectSubmitting;
    }
}

function syncProjectModalDraftFromCurrent() {
    projectModalState.nameDraft = currentProject?.name || projectSettings?.branding?.projectName || 'My Guide';
    syncBrandingUI();
}

async function loadProjectModalDetails(projectId) {
    if (!projectId) {
        projectModalState.selectedProjectDataId = null;
        projectModalState.selectedProjectData = null;
        return null;
    }

    if (currentProject?.id === projectId) {
        const details = getProjectModalDetails(projectId);
        projectModalState.selectedProjectDataId = projectId;
        projectModalState.selectedProjectData = details;
        return details;
    }

    if (projectModalState.selectedProjectDataId === projectId && projectModalState.selectedProjectData) {
        return projectModalState.selectedProjectData;
    }

    projectModalState.isLoadingSelection = true;
    renderProjectModal();

    try {
        const details = await requestJson(`/api/projects/${encodeURIComponent(projectId)}`);
        projectModalState.selectedProjectDataId = projectId;
        projectModalState.selectedProjectData = details;
        return details;
    } finally {
        projectModalState.isLoadingSelection = false;
    }
}

async function refreshProjectModalState(targetProjectId = projectModalState.selectedProjectId) {
    await refreshProjectList();
    projectModalState.selectedProjectId = targetProjectId || currentProject?.id || availableProjects[0]?.id || null;
    projectModalState.selectedProjectDataId = null;
    projectModalState.selectedProjectData = null;
    syncProjectModalDraftFromCurrent();
    await loadProjectModalDetails(projectModalState.selectedProjectId);
    renderProjectModal();
}

function buildProjectListMarkup() {
    if (!availableProjects.length) {
        return '<div class="project-empty-state">No saved projects yet. Use the + button to create or import a project.</div>';
    }

    return availableProjects.map((project) => {
        const isActive = project.id === projectModalState.selectedProjectId;
        const isCurrent = project.id === currentProject?.id;

        return `
            <div class="project-list-item ${isActive ? 'active' : ''} ${isCurrent ? 'is-current' : ''}" onclick="window.selectProjectModalProject('${project.id}')">
                <div class="project-list-item-main">
                    <div class="project-list-item-name">${escapeHtml(project.name || project.id)}</div>
                    <div class="project-list-item-meta">${escapeHtml(buildProjectListMeta(project))}</div>
                </div>
                <div class="project-list-item-actions">
                    <span class="project-list-state project-list-state--current ${isCurrent ? 'is-visible' : ''}" title="Current project">
                        <i class="fa-solid fa-star"></i>
                    </span>
                    <span class="project-list-state project-list-state--selected ${isActive ? 'is-visible' : ''}" title="Selected project">
                        <i class="fa-solid fa-check"></i>
                    </span>
                    <button type="button" class="project-list-delete-btn" title="Delete project" onclick="window.deleteProjectFromModal(event, '${project.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderProjectModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    ensureProjectModalSelection();

    const selectedProject = getSelectedProjectFromModal();
    const selectedDetails = getProjectModalDetails(selectedProject?.id);
    const isCurrentSelection = !!selectedProject && selectedProject.id === currentProject?.id;

    const listEl = document.getElementById('project-list-items');
    const currentPanel = document.getElementById('project-modal-current-panel');
    const selectedPanel = document.getElementById('project-modal-selected-panel');
    const currentNameEl = document.getElementById('project-modal-current-name');
    const currentMetaEl = document.getElementById('project-modal-current-meta');
    const currentNameInput = document.getElementById('project-modal-name-input');
    const currentHelpEl = document.getElementById('project-modal-help');
    const saveBtn = document.getElementById('project-modal-save-btn');
    const copyCurrentBtn = document.getElementById('project-modal-copy-current-btn');
    const exportBtn = document.getElementById('project-modal-export-btn');

    const selectedHeadingEl = document.getElementById('project-modal-selected-name-heading');
    const selectedMetaEl = document.getElementById('project-modal-selected-meta');
    const selectedNameInput = document.getElementById('project-modal-selected-name');
    const selectedSubtitleInput = document.getElementById('project-modal-selected-subtitle');
    const selectedFooterInput = document.getElementById('project-modal-selected-footer');
    const openBtn = document.getElementById('project-modal-open-btn');
    const copySelectedBtn = document.getElementById('project-modal-copy-selected-btn');

    if (listEl) {
        listEl.innerHTML = buildProjectListMarkup();
    }

    if (currentNameEl) {
        currentNameEl.textContent = currentProject?.name || 'No project opened';
    }

    if (currentMetaEl) {
        currentMetaEl.innerHTML = currentProject
            ? buildProjectMetaMarkup(currentProject, slidesData.length)
            : '<div class="project-meta-empty">Start from a new project or open an existing one.</div>';
    }

    if (currentNameInput) {
        currentNameInput.value = projectModalState.nameDraft || currentProject?.name || projectSettings?.branding?.projectName || '';
        currentNameInput.disabled = projectModalState.isSubmitting || !isCurrentSelection;
    }

    if (currentHelpEl) {
        currentHelpEl.textContent = isCurrentSelection
            ? 'Save applies the current name, subtitle, and footer. Copy duplicates this project, and Export downloads its JSON backup.'
            : 'Select the current project from the list to edit its branding and save it from here.';
    }

    if (saveBtn) {
        saveBtn.disabled = projectModalState.isSubmitting || !isCurrentSelection || !currentProject;
    }
    if (copyCurrentBtn) {
        copyCurrentBtn.disabled = projectModalState.isSubmitting || !isCurrentSelection || !currentProject;
    }
    if (exportBtn) {
        exportBtn.disabled = projectModalState.isSubmitting || !isCurrentSelection || !currentProject;
    }

    if (currentPanel) {
        currentPanel.hidden = !isCurrentSelection;
    }

    if (selectedPanel) {
        selectedPanel.hidden = isCurrentSelection;
    }

    if (selectedHeadingEl) {
        selectedHeadingEl.textContent = selectedProject?.name || 'No selection';
    }

    if (selectedMetaEl) {
        if (!selectedProject) {
            selectedMetaEl.innerHTML = '<div class="project-meta-empty">Select a project from the list.</div>';
        } else if (projectModalState.isLoadingSelection && !selectedDetails) {
            selectedMetaEl.innerHTML = '<div class="project-meta-empty">Loading selected project details...</div>';
        } else {
            selectedMetaEl.innerHTML = buildProjectMetaMarkup(selectedDetails || selectedProject);
        }
    }

    if (selectedNameInput) {
        selectedNameInput.value = selectedDetails?.name || selectedProject?.name || '';
    }

    if (selectedSubtitleInput) {
        selectedSubtitleInput.value = selectedDetails?.settings?.branding?.guideSubtitle || '';
    }

    if (selectedFooterInput) {
        selectedFooterInput.value = selectedDetails?.settings?.branding?.footerCopy || '';
    }

    if (openBtn) {
        openBtn.disabled = projectModalState.isSubmitting || !selectedProject || isCurrentSelection;
    }
    if (copySelectedBtn) {
        copySelectedBtn.disabled = projectModalState.isSubmitting || !selectedProject || isCurrentSelection;
    }
}

window.setProjectModalNameDraft = function (value) {
    projectModalState.nameDraft = value;
};

window.setNewProjectDraftField = function (field, value) {
    if (!projectModalState.newProjectDraft || typeof projectModalState.newProjectDraft !== 'object') {
        resetNewProjectDraft();
    }
    projectModalState.newProjectDraft[field] = value;
};

window.selectProjectModalProject = async function (projectId) {
    projectModalState.selectedProjectId = projectId;

    if (projectId === currentProject?.id) {
        syncProjectModalDraftFromCurrent();
    }

    await loadProjectModalDetails(projectId);
    renderProjectModal();
};

window.setProjectModalMode = function () {
    renderProjectModal();
};

window.openProjectModal = async function () {
    projectModalState.mode = 'open';
    projectModalState.isSubmitting = false;
    projectModalState.isLoadingSelection = false;

    try {
        await refreshProjectModalState(currentProject?.id || availableProjects[0]?.id || null);
    } catch (err) {
        showModal('Failed to load project list.\n' + err.message);
    }
};

window.closeProjectModal = function () {
    projectModalState.isSubmitting = false;
    projectModalState.isLoadingSelection = false;
    if (typeof window.closeNewProjectDialog === 'function') {
        window.closeNewProjectDialog();
    }
};

window.refreshProjectModalList = async function () {
    try {
        await refreshProjectModalState(projectModalState.selectedProjectId);
    } catch (err) {
        showModal('Failed to refresh project list.\n' + err.message);
    }
};

window.openNewProjectDialog = function () {
    projectModalState.isNewProjectSubmitting = false;
    resetNewProjectDraft();
    renderNewProjectDialog();
};

window.closeNewProjectDialog = function () {
    projectModalState.isNewProjectSubmitting = false;
    renderNewProjectDialog();
};

window.triggerNewProjectImport = function () {
    const input = document.getElementById('new-project-import-input');
    if (input && !projectModalState.isNewProjectSubmitting) {
        input.click();
    }
};

window.submitNewProjectCreate = async function () {
    if (projectModalState.isNewProjectSubmitting) return;

    const nameInput = document.getElementById('new-project-name-input');
    if (nameInput && !nameInput.reportValidity()) {
        return;
    }

    const projectName = normalizeProjectName(projectModalState.newProjectDraft?.name, '');
    if (!projectName) {
        showModal('Enter a project name first.');
        return;
    }

    const settings = getDefaultProjectSettings(projectName);
    settings.branding.guideSubtitle = (projectModalState.newProjectDraft?.subtitle || '').trim() || settings.branding.guideSubtitle;
    settings.branding.footerCopy = (projectModalState.newProjectDraft?.footer || '').trim() || projectName;

    projectModalState.isNewProjectSubmitting = true;
    renderNewProjectDialog();

    try {
        const created = await requestJson('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({ name: projectName }, buildProjectDataDocument([], settings, projectName)))
        });

        await loadProjectById(created.id);
        await refreshProjectModalState(created.id);
        if (typeof window.closeNewProjectDialog === 'function') {
            window.closeNewProjectDialog();
        }
        showModal(`Created project: ${created.name}`);
    } catch (err) {
        showModal('Failed to create the new project.\n' + err.message);
    } finally {
        projectModalState.isNewProjectSubmitting = false;
        renderNewProjectDialog();
    }
};

async function copyProjectFromDetails(sourceDetails) {
    if (!sourceDetails) {
        showModal('Choose a project first.');
        return;
    }

    const copyName = getUniqueCopyProjectName(sourceDetails.name || sourceDetails.settings?.branding?.projectName || sourceDetails.id);
    const payload = buildProjectDataDocument(
        cloneSlides(sourceDetails.slides || []),
        sourceDetails.settings || projectSettings,
        copyName
    );

    const created = await requestJson('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ name: copyName }, payload))
    });

    await loadProjectById(created.id);
    await refreshProjectModalState(created.id);
    showModal(`Copied project: ${created.name}`);
}

window.copyCurrentProjectFromModal = async function () {
    if (projectModalState.isSubmitting || !currentProject?.id) return;

    projectModalState.isSubmitting = true;
    renderProjectModal();

    try {
        await copyProjectFromDetails(getCopySourceDetails(currentProject.id));
    } catch (err) {
        showModal('Failed to copy the current project.\n' + err.message);
    } finally {
        projectModalState.isSubmitting = false;
        renderProjectModal();
    }
};

window.copySelectedProjectFromModal = async function () {
    if (projectModalState.isSubmitting) return;

    const selectedProject = getSelectedProjectFromModal();
    if (!selectedProject || selectedProject.id === currentProject?.id) {
        showModal('Choose another project from the list first.');
        return;
    }

    projectModalState.isSubmitting = true;
    renderProjectModal();

    try {
        const details = await loadProjectModalDetails(selectedProject.id);
        await copyProjectFromDetails(details);
    } catch (err) {
        showModal('Failed to copy the selected project.\n' + err.message);
    } finally {
        projectModalState.isSubmitting = false;
        renderProjectModal();
    }
};

window.exportCurrentProjectFromModal = function () {
    if (projectModalState.isSubmitting || !currentProject?.id) return;
    window.downloadData();
};

window.saveCurrentProjectFromModal = async function () {
    if (projectModalState.isSubmitting || !currentProject?.id) return;

    const input = document.getElementById('project-modal-name-input');
    if (input && !input.reportValidity()) {
        return;
    }

    const nextName = (projectModalState.nameDraft || '').trim();
    if (!nextName) {
        showModal('Enter a project name first.');
        return;
    }

    projectModalState.isSubmitting = true;
    renderProjectModal();

    try {
        collectBrandingFromUI();

        if (nextName !== currentProject.name) {
            const renamed = await requestJson(`/api/projects/${encodeURIComponent(currentProject.id)}/meta`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nextName })
            });

            currentProject = {
                id: currentProject.id,
                name: renamed.project.name,
                savedVersion: normalizeSavedVersion(renamed.project.savedVersion)
            };
            syncProjectBrandingName(renamed.project.name);
            updateProjectIndicator();
        }

        await window.exportData();
        await refreshProjectModalState(currentProject.id);
    } catch (err) {
        showModal('Failed to save the current project.\n' + err.message);
    } finally {
        projectModalState.isSubmitting = false;
        renderProjectModal();
    }
};

window.openSelectedProjectFromModal = async function () {
    if (projectModalState.isSubmitting) return;

    const selectedProject = getSelectedProjectFromModal();
    if (!selectedProject) {
        showModal('Choose a project from the list first.');
        return;
    }

    if (selectedProject.id === currentProject?.id) {
        showModal('That project is already open.');
        return;
    }

    projectModalState.isSubmitting = true;
    renderProjectModal();

    try {
        await loadProjectById(selectedProject.id, { showMessage: true });
        await refreshProjectModalState(currentProject?.id || selectedProject.id);
    } catch (err) {
        showModal('Failed to open the selected project.\n' + err.message);
    } finally {
        projectModalState.isSubmitting = false;
        renderProjectModal();
    }
};

window.handleProjectImportSuccess = async function (projectId) {
    projectModalState.isNewProjectSubmitting = false;
    if (typeof window.closeNewProjectDialog === 'function') {
        window.closeNewProjectDialog();
    }
    await refreshProjectModalState(projectId || currentProject?.id);
};

window.deleteProjectFromModal = function (event, projectId) {
    event?.stopPropagation();

    const targetProject = availableProjects.find((project) => project.id === projectId);
    if (!targetProject) return;

    showModal(`Delete project "${targetProject.name}"?\nThis will remove its saved data.`, true, async () => {
        try {
            projectModalState.isSubmitting = true;
            renderProjectModal();

            const deleted = await requestJson(`/api/projects/${encodeURIComponent(projectId)}`, {
                method: 'DELETE'
            });

            if (deleted.currentProjectId) {
                await loadProjectById(deleted.currentProjectId);
            } else {
                await refreshProjectList();
            }

            await refreshProjectModalState(deleted.currentProjectId || currentProject?.id || availableProjects[0]?.id || null);
            showModal(`Deleted project: ${targetProject.name}`);
        } catch (err) {
            showModal('Failed to delete the selected project.\n' + err.message);
        } finally {
            projectModalState.isSubmitting = false;
            renderProjectModal();
        }
    });
};

window.createProject = function () {
    window.openNewProjectDialog();
};

window.saveAsProject = function () {
    return window.copyCurrentProjectFromModal();
};

window.openProjectPicker = function () {
    return window.openProjectModal();
};

window.submitProjectModalAction = async function () {
    const selectedProject = getSelectedProjectFromModal();
    if (selectedProject && selectedProject.id === currentProject?.id) {
        return window.saveCurrentProjectFromModal();
    }
    return window.openSelectedProjectFromModal();
};
