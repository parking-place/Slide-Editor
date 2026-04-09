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

    return `${projectDetails.id} / ${slideCount} slides / ${getSavedVersionLabel(projectDetails.savedVersion)}`;
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

function buildProjectListMarkup() {
    if (!availableProjects.length) {
        return '<div class="project-empty-state">No saved projects yet. Create your first project from the project tools below.</div>';
    }

    return availableProjects.map((project) => {
        const isActive = project.id === projectModalState.selectedProjectId;
        const isCurrent = project.id === currentProject?.id;
        const slideCount = Number.isFinite(project.slideCount) ? project.slideCount : 0;
        const versionLabel = getSavedVersionLabel(project.savedVersion);

        return `
            <div class="project-list-item ${isActive ? 'active' : ''} ${isCurrent ? 'is-current' : ''}" onclick="window.selectProjectModalProject('${project.id}')">
                <div class="project-list-item-main">
                    <div class="project-list-item-name">${escapeHtml(project.name || project.id)}</div>
                    <div class="project-list-item-meta">${slideCount} slides / ${escapeHtml(project.id)} / ${escapeHtml(versionLabel)}</div>
                </div>
                <div class="project-list-item-actions">
                    <span class="project-list-state ${isCurrent ? 'is-visible' : ''}" title="Current project">
                        <i class="fa-solid fa-circle-check"></i>
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

    const selectedHeadingEl = document.getElementById('project-modal-selected-name-heading');
    const selectedMetaEl = document.getElementById('project-modal-selected-meta');
    const selectedNameInput = document.getElementById('project-modal-selected-name');
    const selectedSubtitleInput = document.getElementById('project-modal-selected-subtitle');
    const selectedFooterInput = document.getElementById('project-modal-selected-footer');
    const openBtn = document.getElementById('project-modal-open-btn');

    if (listEl) {
        listEl.innerHTML = buildProjectListMarkup();
    }

    if (currentNameEl) {
        currentNameEl.textContent = currentProject?.name || 'No project opened';
    }

    if (currentMetaEl) {
        currentMetaEl.textContent = currentProject
            ? buildProjectModalMetaLine(currentProject, slidesData.length)
            : 'Start from a new project or open an existing one.';
    }

    if (currentNameInput) {
        currentNameInput.value = projectModalState.nameDraft || currentProject?.name || projectSettings?.branding?.projectName || '';
        currentNameInput.disabled = projectModalState.isSubmitting || !isCurrentSelection;
    }

    if (currentHelpEl) {
        currentHelpEl.textContent = isCurrentSelection
            ? 'Save applies the edited name, subtitle, and footer to the current project.'
            : 'Select the current project from the list to edit and save its branding values here.';
    }

    if (saveBtn) {
        saveBtn.disabled = projectModalState.isSubmitting || !isCurrentSelection || !currentProject;
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
            selectedMetaEl.textContent = 'Select a project from the list.';
        } else if (projectModalState.isLoadingSelection && !selectedDetails) {
            selectedMetaEl.textContent = 'Loading selected project details...';
        } else {
            selectedMetaEl.textContent = buildProjectModalMetaLine(selectedDetails || selectedProject);
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
}

window.setProjectModalNameDraft = function (value) {
    projectModalState.nameDraft = value;
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
        await refreshProjectList();
        projectModalState.selectedProjectId = currentProject?.id || availableProjects[0]?.id || null;
        projectModalState.selectedProjectDataId = null;
        projectModalState.selectedProjectData = null;
        syncProjectModalDraftFromCurrent();
        await loadProjectModalDetails(projectModalState.selectedProjectId);
        renderProjectModal();
    } catch (err) {
        showModal('Failed to load project list.\n' + err.message);
    }
};

window.closeProjectModal = function () {
    projectModalState.isSubmitting = false;
};

window.refreshProjectModalList = async function () {
    try {
        await refreshProjectList();
        ensureProjectModalSelection();
        projectModalState.selectedProjectDataId = null;
        projectModalState.selectedProjectData = null;
        await loadProjectModalDetails(projectModalState.selectedProjectId);
        renderProjectModal();
    } catch (err) {
        showModal('Failed to refresh project list.\n' + err.message);
    }
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
        await refreshProjectList();
        projectModalState.selectedProjectId = currentProject.id;
        syncProjectModalDraftFromCurrent();
        await loadProjectModalDetails(currentProject.id);
        renderProjectModal();
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
        projectModalState.selectedProjectId = currentProject?.id || selectedProject.id;
        syncProjectModalDraftFromCurrent();
        await loadProjectModalDetails(projectModalState.selectedProjectId);
        renderProjectModal();
    } catch (err) {
        showModal('Failed to open the selected project.\n' + err.message);
    } finally {
        projectModalState.isSubmitting = false;
        renderProjectModal();
    }
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

            await refreshProjectList();

            if (deleted.currentProjectId) {
                await loadProjectById(deleted.currentProjectId);
            }

            projectModalState.selectedProjectId = deleted.currentProjectId || currentProject?.id || availableProjects[0]?.id || null;
            syncProjectModalDraftFromCurrent();
            await loadProjectModalDetails(projectModalState.selectedProjectId);
            renderProjectModal();
            showModal(`Deleted project: ${targetProject.name}`);
        } catch (err) {
            showModal('Failed to delete the selected project.\n' + err.message);
        } finally {
            projectModalState.isSubmitting = false;
            renderProjectModal();
        }
    });
};

window.submitProjectModalAction = async function () {
    const selectedProject = getSelectedProjectFromModal();
    if (selectedProject && selectedProject.id === currentProject?.id) {
        return window.saveCurrentProjectFromModal();
    }
    return window.openSelectedProjectFromModal();
};
