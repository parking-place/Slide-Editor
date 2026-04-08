'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8000;
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const THEMES_DIR = path.join(DATA_DIR, 'themes');
const BUNDLED_THEMES_DIR = path.join(ROOT, 'builtin_themes');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const PROJECTS_INDEX_PATH = path.join(PROJECTS_DIR, 'index.json');
const APP_STATE_PATH = path.join(PROJECTS_DIR, 'app_state.json');
const LEGACY_SLIDE_DATA_PATH = path.join(DATA_DIR, 'slide_data.json');
const LEGACY_IMAGE_DATA_DIR = path.join(DATA_DIR, 'image_data');
const DEFAULT_PROJECT_ID = 'default';

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function listThemeFiles() {
    const collected = new Set();

    [THEMES_DIR, BUNDLED_THEMES_DIR].forEach((dirPath) => {
        if (!fs.existsSync(dirPath)) return;
        fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.slidetheme'))
            .forEach(file => collected.add(file));
    });

    return Array.from(collected).sort();
}

function getThemeFilePath(name) {
    const preferredPath = path.join(THEMES_DIR, name);
    if (fs.existsSync(preferredPath)) {
        return preferredPath;
    }

    const bundledPath = path.join(BUNDLED_THEMES_DIR, name);
    if (fs.existsSync(bundledPath)) {
        return bundledPath;
    }

    return null;
}

function seedThemesDirIfEmpty() {
    ensureDir(THEMES_DIR);
    if (!fs.existsSync(BUNDLED_THEMES_DIR)) return;

    const existingThemes = fs.readdirSync(THEMES_DIR).filter(file => file.endsWith('.slidetheme'));
    if (existingThemes.length > 0) return;

    fs.readdirSync(BUNDLED_THEMES_DIR)
        .filter(file => file.endsWith('.slidetheme'))
        .forEach((file) => {
            fs.copyFileSync(
                path.join(BUNDLED_THEMES_DIR, file),
                path.join(THEMES_DIR, file)
            );
        });
}

function readJsonIfExists(filePath) {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function getTimestamp() {
    return new Date().toISOString();
}

function createDefaultSettings(projectName = 'My Guide') {
    return {
        activeTheme: 'hpe_default',
        branding: {
            projectName,
            guideSubtitle: '가이드 부제',
            footerCopy: projectName
        }
    };
}

function mergeSettings(settings, fallbackProjectName = 'My Guide') {
    const defaults = createDefaultSettings(fallbackProjectName);
    const safeSettings = settings && typeof settings === 'object' ? settings : {};
    const safeBranding = safeSettings.branding && typeof safeSettings.branding === 'object'
        ? safeSettings.branding
        : {};

    return {
        activeTheme: safeSettings.activeTheme || defaults.activeTheme,
        branding: Object.assign({}, defaults.branding, safeBranding)
    };
}

function createEmptyProjectPayload(projectName = 'My Guide') {
    return {
        settings: createDefaultSettings(projectName),
        slides: []
    };
}

function getProjectDir(projectId) {
    return path.join(PROJECTS_DIR, projectId);
}

function getProjectDataPath(projectId) {
    return path.join(getProjectDir(projectId), 'slide_data.json');
}

function getProjectMetaPath(projectId) {
    return path.join(getProjectDir(projectId), 'meta.json');
}

function getProjectImageDir(projectId) {
    return path.join(getProjectDir(projectId), 'image_data');
}

function getProjectImageUrl(projectId, fileName) {
    return `/api/projects/${encodeURIComponent(projectId)}/images/${encodeURIComponent(fileName)}`;
}

function normalizeProjectId(name) {
    const slug = String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || 'project';
}

function getImageExtension(mimeType) {
    const normalized = String(mimeType || '').toLowerCase();
    const extMap = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/svg+xml': 'svg'
    };
    return extMap[normalized] || 'bin';
}

function isValidProjectId(projectId) {
    return typeof projectId === 'string' && /^[a-z0-9-]+$/.test(projectId);
}

function getProjectsIndex() {
    const index = readJsonIfExists(PROJECTS_INDEX_PATH);
    return Array.isArray(index && index.projects) ? index : { projects: [] };
}

function saveProjectsIndex(index) {
    writeJson(PROJECTS_INDEX_PATH, index);
}

function getAppState() {
    const state = readJsonIfExists(APP_STATE_PATH);
    if (!state || typeof state !== 'object') {
        return { currentProjectId: DEFAULT_PROJECT_ID, recentProjectIds: [DEFAULT_PROJECT_ID] };
    }
    return {
        currentProjectId: state.currentProjectId || DEFAULT_PROJECT_ID,
        recentProjectIds: Array.isArray(state.recentProjectIds) ? state.recentProjectIds : [DEFAULT_PROJECT_ID]
    };
}

function saveAppState(state) {
    writeJson(APP_STATE_PATH, state);
}

function setCurrentProject(projectId) {
    const state = getAppState();
    const recentProjectIds = [projectId].concat(
        state.recentProjectIds.filter(id => id !== projectId)
    ).slice(0, 10);

    saveAppState({
        currentProjectId: projectId,
        recentProjectIds
    });
}

function readProjectMeta(projectId) {
    return readJsonIfExists(getProjectMetaPath(projectId));
}

function getSlideCount(payload) {
    if (Array.isArray(payload)) return payload.length;
    if (payload && typeof payload === 'object' && Array.isArray(payload.slides)) return payload.slides.length;
    return 0;
}

function syncProjectIndexEntry(meta) {
    const index = getProjectsIndex();
    const projects = index.projects.filter(project => project.id !== meta.id);
    projects.push({
        id: meta.id,
        name: meta.name,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
        slideCount: meta.slideCount
    });
    projects.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    saveProjectsIndex({ projects });
}

function removeProjectIndexEntry(projectId) {
    const index = getProjectsIndex();
    saveProjectsIndex({
        projects: index.projects.filter(project => project.id !== projectId)
    });
}

function updateProjectMeta(projectId, updates = {}) {
    const meta = readProjectMeta(projectId);
    const payload = readJsonIfExists(getProjectDataPath(projectId));
    if (!meta || !payload) return null;

    const nextMeta = {
        ...meta,
        name: String(updates.name || meta.name || projectId).trim() || projectId,
        updatedAt: getTimestamp(),
        slideCount: getSlideCount(payload)
    };

    writeJson(getProjectMetaPath(projectId), nextMeta);
    syncProjectIndexEntry(nextMeta);

    return {
        id: nextMeta.id,
        name: nextMeta.name,
        createdAt: nextMeta.createdAt,
        updatedAt: nextMeta.updatedAt,
        slideCount: nextMeta.slideCount
    };
}

function deleteProject(projectId) {
    if (!fs.existsSync(getProjectDir(projectId))) {
        return null;
    }

    fs.rmSync(getProjectDir(projectId), { recursive: true, force: true });
    removeProjectIndexEntry(projectId);

    let index = getProjectsIndex();
    let currentProjectId = getAppState().currentProjectId;

    if (index.projects.length === 0) {
        saveProject(DEFAULT_PROJECT_ID, 'My Guide', createEmptyProjectPayload('My Guide'));
        index = getProjectsIndex();
        currentProjectId = DEFAULT_PROJECT_ID;
    } else if (currentProjectId === projectId || !fs.existsSync(getProjectDir(currentProjectId))) {
        currentProjectId = index.projects[0].id;
    }

    setCurrentProject(currentProjectId);

    return {
        deletedProjectId: projectId,
        currentProjectId,
        projects: index.projects
    };
}

function parseProjectImageReference(imageValue) {
    if (typeof imageValue !== 'string') return null;
    const normalized = imageValue.replace(/\\/g, '/');

    let match = normalized.match(/^\/api\/projects\/([^/]+)\/images\/([^/?#]+)$/);
    if (match) {
        return {
            type: 'project',
            projectId: decodeURIComponent(match[1]),
            fileName: decodeURIComponent(match[2])
        };
    }

    match = normalized.match(/^\.?\/?image_data\/([^/?#]+)$/);
    if (match) {
        return {
            type: 'relative',
            fileName: decodeURIComponent(match[1])
        };
    }

    match = normalized.match(/^\.?\/?data\/image_data\/([^/?#]+)$/);
    if (match) {
        return {
            type: 'legacy',
            fileName: decodeURIComponent(match[1])
        };
    }

    return null;
}

function copyImageFileIfNeeded(sourcePath, targetPath) {
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Image source not found: ${sourcePath}`);
    }
    ensureDir(path.dirname(targetPath));
    if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
    }
}

function persistProjectImage(imageValue, targetProjectId) {
    if (typeof imageValue !== 'string' || imageValue.trim() === '') {
        return imageValue;
    }

    if (imageValue.startsWith('data:image/')) {
        const matched = imageValue.match(/^data:(image\/[a-zA-Z0-9.+-]+(?:\+xml)?);base64,(.+)$/);
        if (!matched) {
            return imageValue;
        }

        const mimeType = matched[1];
        const base64Data = matched[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const imageHash = crypto.createHash('sha1').update(imageBuffer).digest('hex');
        const fileName = `${imageHash}.${getImageExtension(mimeType)}`;
        const imagePath = path.join(getProjectImageDir(targetProjectId), fileName);

        ensureDir(getProjectImageDir(targetProjectId));
        if (!fs.existsSync(imagePath)) {
            fs.writeFileSync(imagePath, imageBuffer);
        }

        return getProjectImageUrl(targetProjectId, fileName);
    }

    const imageRef = parseProjectImageReference(imageValue);
    if (!imageRef) {
        return imageValue;
    }

    if (imageRef.type === 'project') {
        const sourcePath = path.join(getProjectImageDir(imageRef.projectId), imageRef.fileName);
        const targetPath = path.join(getProjectImageDir(targetProjectId), imageRef.fileName);
        copyImageFileIfNeeded(sourcePath, targetPath);
        return getProjectImageUrl(targetProjectId, imageRef.fileName);
    }

    if (imageRef.type === 'relative') {
        const sourcePath = path.join(getProjectImageDir(targetProjectId), imageRef.fileName);
        const targetPath = path.join(getProjectImageDir(targetProjectId), imageRef.fileName);
        copyImageFileIfNeeded(sourcePath, targetPath);
        return getProjectImageUrl(targetProjectId, imageRef.fileName);
    }

    if (imageRef.type === 'legacy') {
        const sourcePath = path.join(LEGACY_IMAGE_DATA_DIR, imageRef.fileName);
        const targetPath = path.join(getProjectImageDir(targetProjectId), imageRef.fileName);
        copyImageFileIfNeeded(sourcePath, targetPath);
        return getProjectImageUrl(targetProjectId, imageRef.fileName);
    }

    return imageValue;
}

function normalizeProjectPayload(body, targetProjectId, fallbackProjectName = 'My Guide') {
    const payload = typeof body === 'string' ? JSON.parse(body) : body;

    if (Array.isArray(payload)) {
        return {
            settings: createDefaultSettings(fallbackProjectName),
            slides: payload.map(slide => {
                if (!slide || typeof slide !== 'object') return slide;
                return Object.assign({}, slide, {
                    image: persistProjectImage(slide.image, targetProjectId)
                });
            })
        };
    }

    const safePayload = payload && typeof payload === 'object' ? payload : {};
    const slides = Array.isArray(safePayload.slides) ? safePayload.slides : [];

    return {
        settings: mergeSettings(safePayload.settings, fallbackProjectName),
        slides: slides.map(slide => {
            if (!slide || typeof slide !== 'object') return slide;
            return Object.assign({}, slide, {
                image: persistProjectImage(slide.image, targetProjectId)
            });
        })
    };
}

function createProjectMeta(projectId, name, payload, existingMeta = null) {
    const now = getTimestamp();
    const safeName = String(name || existingMeta?.name || projectId).trim() || projectId;
    return {
        id: projectId,
        name: safeName,
        createdAt: existingMeta?.createdAt || now,
        updatedAt: now,
        slideCount: getSlideCount(payload)
    };
}

function saveProject(projectId, name, body) {
    const normalizedPayload = normalizeProjectPayload(body, projectId, name || projectId);
    const existingMeta = readProjectMeta(projectId);
    const meta = createProjectMeta(projectId, name, normalizedPayload, existingMeta);

    ensureDir(getProjectDir(projectId));
    ensureDir(getProjectImageDir(projectId));
    writeJson(getProjectDataPath(projectId), normalizedPayload);
    writeJson(getProjectMetaPath(projectId), meta);
    syncProjectIndexEntry(meta);

    return {
        id: meta.id,
        name: meta.name,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
        slideCount: meta.slideCount
    };
}

function loadProjectPayload(projectId) {
    const meta = readProjectMeta(projectId);
    const payload = readJsonIfExists(getProjectDataPath(projectId));
    if (!meta || !payload) return null;

    return Object.assign({
        id: meta.id,
        name: meta.name,
        meta
    }, payload);
}

function createProject(projectName, body) {
    const projectId = normalizeProjectId(projectName);
    if (fs.existsSync(getProjectDir(projectId))) {
        return null;
    }
    const summary = saveProject(projectId, projectName, body);
    return Object.assign({ id: projectId }, summary);
}

function initializeProjectStorage() {
    seedThemesDirIfEmpty();
    ensureDir(PROJECTS_DIR);

    if (!fs.existsSync(PROJECTS_INDEX_PATH)) {
        saveProjectsIndex({ projects: [] });
    }

    if (!fs.existsSync(APP_STATE_PATH)) {
        saveAppState({ currentProjectId: DEFAULT_PROJECT_ID, recentProjectIds: [DEFAULT_PROJECT_ID] });
    }

    const index = getProjectsIndex();
    const hasProjects = index.projects.length > 0;
    const legacyPayload = readJsonIfExists(LEGACY_SLIDE_DATA_PATH);

    if (!hasProjects && legacyPayload) {
        const migratedProjectName =
            legacyPayload?.settings?.branding?.projectName ||
            legacyPayload?.settings?.branding?.footerCopy ||
            'My Guide';
        saveProject(DEFAULT_PROJECT_ID, migratedProjectName, legacyPayload);
        setCurrentProject(DEFAULT_PROJECT_ID);
        return;
    }

    if (!hasProjects) {
        saveProject(DEFAULT_PROJECT_ID, 'My Guide', createEmptyProjectPayload('My Guide'));
        setCurrentProject(DEFAULT_PROJECT_ID);
        return;
    }

    const state = getAppState();
    const currentExists = fs.existsSync(getProjectDir(state.currentProjectId));
    if (!currentExists) {
        setCurrentProject(index.projects[0].id);
    }
}

initializeProjectStorage();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use((req, res, next) => {
    if (req.path.includes('..')) {
        return res.status(400).json({ error: 'Invalid path' });
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.text({
    limit: '50mb',
    type: ['text/plain', 'text/html', 'application/xhtml+xml']
}));

app.get('/api/themes', (req, res) => {
    try {
        res.json(listThemeFiles());
    } catch (err) {
        console.error('[GET /api/themes]', err);
        res.status(500).json({ error: 'Failed to read themes directory' });
    }
});

app.get('/api/themes/:name', (req, res) => {
    const name = req.params.name;
    if (!name.endsWith('.slidetheme') || name.includes('..')) {
        return res.status(400).json({ error: 'Invalid theme name' });
    }

    const filePath = getThemeFilePath(name);
    if (!filePath) {
        return res.status(404).json({ error: 'Theme not found' });
    }

    try {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.send(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.error('[GET /api/themes/:name]', err);
        res.status(500).json({ error: 'Failed to read theme file' });
    }
});

app.post('/api/themes/:name', (req, res) => {
    const name = req.params.name;
    if (!name.endsWith('.slidetheme') || name.includes('..')) {
        return res.status(400).json({ error: 'Invalid theme name' });
    }

    try {
        ensureDir(THEMES_DIR);
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);
        fs.writeFileSync(path.join(THEMES_DIR, name), body, 'utf8');
        res.json({ status: 'success' });
    } catch (err) {
        console.error('[POST /api/themes/:name]', err);
        res.status(500).json({ error: 'Failed to save theme file' });
    }
});

app.get('/api/app-state', (req, res) => {
    res.json(getAppState());
});

app.put('/api/app-state', (req, res) => {
    const projectId = req.body && req.body.currentProjectId;
    if (!isValidProjectId(projectId) || !fs.existsSync(getProjectDir(projectId))) {
        return res.status(400).json({ error: 'Invalid current project id' });
    }

    setCurrentProject(projectId);
    res.json({ status: 'success', currentProjectId: projectId });
});

app.get('/api/projects', (req, res) => {
    res.json(getProjectsIndex().projects);
});

app.post('/api/projects', (req, res) => {
    const requestedName = String(req.body && req.body.name || '').trim();
    if (!requestedName) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    const requestedId = normalizeProjectId(requestedName);
    if (fs.existsSync(getProjectDir(requestedId))) {
        return res.status(409).json({ error: 'Project already exists', projectId: requestedId });
    }

    try {
        const body = req.body && req.body.template === 'empty'
            ? createEmptyProjectPayload(requestedName)
            : {
                settings: req.body && req.body.settings,
                slides: req.body && req.body.slides
            };

        const project = createProject(requestedName, body);
        setCurrentProject(project.id);
        res.status(201).json(project);
    } catch (err) {
        console.error('[POST /api/projects]', err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.get('/api/projects/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    if (!isValidProjectId(projectId)) {
        return res.status(400).json({ error: 'Invalid project id' });
    }

    const project = loadProjectPayload(projectId);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
});

app.put('/api/projects/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    if (!isValidProjectId(projectId) || !fs.existsSync(getProjectDir(projectId))) {
        return res.status(400).json({ error: 'Invalid project id' });
    }

    try {
        const existingMeta = readProjectMeta(projectId);
        const project = saveProject(projectId, existingMeta?.name || projectId, req.body);
        setCurrentProject(projectId);
        res.json({ status: 'success', project });
    } catch (err) {
        console.error('[PUT /api/projects/:projectId]', err);
        res.status(500).json({ error: 'Failed to save project' });
    }
});

app.put('/api/projects/:projectId/meta', (req, res) => {
    const projectId = req.params.projectId;
    const name = String(req.body && req.body.name || '').trim();

    if (!isValidProjectId(projectId) || !fs.existsSync(getProjectDir(projectId))) {
        return res.status(400).json({ error: 'Invalid project id' });
    }

    if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    try {
        const project = updateProjectMeta(projectId, { name });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (getAppState().currentProjectId === projectId) {
            setCurrentProject(projectId);
        }
        res.json({ status: 'success', project });
    } catch (err) {
        console.error('[PUT /api/projects/:projectId/meta]', err);
        res.status(500).json({ error: 'Failed to rename project' });
    }
});

app.delete('/api/projects/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    if (!isValidProjectId(projectId) || !fs.existsSync(getProjectDir(projectId))) {
        return res.status(400).json({ error: 'Invalid project id' });
    }

    try {
        const result = deleteProject(projectId);
        res.json({ status: 'success', ...result });
    } catch (err) {
        console.error('[DELETE /api/projects/:projectId]', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

app.get('/api/projects/:projectId/images/:fileName', (req, res) => {
    const projectId = req.params.projectId;
    const fileName = req.params.fileName;

    if (!isValidProjectId(projectId) || !fileName || fileName.includes('/') || fileName.includes('\\')) {
        return res.status(400).json({ error: 'Invalid image path' });
    }

    const filePath = path.join(getProjectImageDir(projectId), fileName);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image not found' });
    }

    res.sendFile(filePath);
});

app.post('/api/save', (req, res) => {
    try {
        const currentProjectId = getAppState().currentProjectId || DEFAULT_PROJECT_ID;
        const meta = readProjectMeta(currentProjectId);
        const project = saveProject(currentProjectId, meta?.name || currentProjectId, req.body);
        res.json({ status: 'success', project });
    } catch (err) {
        console.error('[POST /api/save]', err);
        res.status(500).json({ error: 'Failed to save current project' });
    }
});

app.post('/api/saveHtml', (req, res) => {
    const exportsDir = path.join(ROOT, 'exports');
    const savePath = path.join(exportsDir, 'SlideEditor_Web_Guide.html');

    try {
        ensureDir(exportsDir);
        const body = typeof req.body === 'string'
            ? req.body
            : Buffer.isBuffer(req.body)
                ? req.body.toString('utf8')
                : '';

        if (!body.trim()) {
            return res.status(400).json({ error: 'Empty HTML body' });
        }

        fs.writeFileSync(savePath, body, 'utf8');
        res.json({ status: 'success' });
    } catch (err) {
        console.error('[POST /api/saveHtml]', err);
        res.status(500).json({ error: 'Failed to save HTML guide' });
    }
});

app.get('/', (req, res) => {
    res.redirect('/SlideEditor.html');
});

app.use(express.static(ROOT, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}));

app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.path}` });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('===============================================');
    console.log('       Slide Editor Server (Docker/Node.js)');
    console.log('===============================================');
    console.log(`  -> Server: http://0.0.0.0:${PORT}/`);
    console.log(`  -> Editor: http://localhost:${PORT}/SlideEditor.html`);
    console.log('===============================================');
});
