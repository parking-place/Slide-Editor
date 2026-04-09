'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');

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
const IMAGE_INDEX_FILE = 'index.json';
const IMAGE_STATUS = {
    QUEUED: 'queued',
    CONVERTING: 'converting',
    READY: 'ready',
    FAILED: 'failed'
};
const activeImageConversions = new Map();

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

function getProjectImageOriginalsDir(projectId) {
    return path.join(getProjectImageDir(projectId), 'originals');
}

function getProjectImageConvertedDir(projectId) {
    return path.join(getProjectImageDir(projectId), 'converted');
}

function getProjectImageIndexPath(projectId) {
    return path.join(getProjectImageDir(projectId), IMAGE_INDEX_FILE);
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

function createImageAssetId() {
    return crypto.randomBytes(12).toString('hex');
}

function ensureProjectImageStorage(projectId) {
    ensureDir(getProjectImageDir(projectId));
    ensureDir(getProjectImageOriginalsDir(projectId));
    ensureDir(getProjectImageConvertedDir(projectId));

    const indexPath = getProjectImageIndexPath(projectId);
    if (!fs.existsSync(indexPath)) {
        writeJson(indexPath, { assets: {} });
    }
}

function getProjectImageIndex(projectId) {
    ensureProjectImageStorage(projectId);
    const index = readJsonIfExists(getProjectImageIndexPath(projectId));
    if (!index || typeof index !== 'object') {
        return { assets: {} };
    }

    return {
        assets: index.assets && typeof index.assets === 'object' ? index.assets : {}
    };
}

function saveProjectImageIndex(projectId, index) {
    ensureProjectImageStorage(projectId);
    writeJson(getProjectImageIndexPath(projectId), index);
}

function getImageAsset(projectId, assetId) {
    const index = getProjectImageIndex(projectId);
    return index.assets[assetId] || null;
}

function setImageAsset(projectId, assetId, asset) {
    const index = getProjectImageIndex(projectId);
    index.assets[assetId] = asset;
    saveProjectImageIndex(projectId, index);
    return asset;
}

function updateImageAsset(projectId, assetId, updates) {
    const asset = getImageAsset(projectId, assetId);
    if (!asset) return null;

    return setImageAsset(projectId, assetId, Object.assign({}, asset, updates, {
        updatedAt: getTimestamp()
    }));
}

function getProjectRelativePath(projectId, relativePath) {
    return path.join(getProjectDir(projectId), relativePath);
}

function getImageAssetOutputUrls(projectId, assetId) {
    return {
        statusUrl: `/api/projects/${encodeURIComponent(projectId)}/images/${encodeURIComponent(assetId)}/status`,
        fileUrl: `/api/projects/${encodeURIComponent(projectId)}/images/${encodeURIComponent(assetId)}/file`,
        originalUrl: `/api/projects/${encodeURIComponent(projectId)}/images/${encodeURIComponent(assetId)}/original`
    };
}

function serializeImageAsset(projectId, asset) {
    if (!asset) return null;
    return Object.assign({}, asset, getImageAssetOutputUrls(projectId, asset.assetId));
}

function parseImageUploadBody(body) {
    const payload = body && typeof body === 'object' ? body : {};
    const dataUrl = typeof payload.dataUrl === 'string' ? payload.dataUrl.trim() : '';
    const base64Data = typeof payload.base64Data === 'string' ? payload.base64Data.trim() : '';
    const fileName = String(payload.fileName || '').trim() || 'upload';
    let mimeType = String(payload.mimeType || '').trim().toLowerCase();
    let buffer = null;

    if (dataUrl) {
        const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+(?:\+xml)?);base64,(.+)$/);
        if (!match) {
            throw new Error('Invalid image data URL');
        }
        mimeType = mimeType || match[1].toLowerCase();
        buffer = Buffer.from(match[2], 'base64');
    } else if (base64Data && mimeType) {
        buffer = Buffer.from(base64Data, 'base64');
    } else {
        throw new Error('Image payload is required');
    }

    if (!mimeType.startsWith('image/')) {
        throw new Error('Unsupported mime type');
    }

    return {
        fileName,
        mimeType,
        buffer
    };
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

function buildImageAssetMeta(projectId, upload) {
    const assetId = createImageAssetId();
    const extension = getImageExtension(upload.mimeType);
    const originalRelativePath = path.join('image_data', 'originals', `${assetId}.${extension}`).replace(/\\/g, '/');
    const convertedRelativePath = path.join('image_data', 'converted', `${assetId}.webp`).replace(/\\/g, '/');
    const now = getTimestamp();

    return {
        assetId,
        projectId,
        sourceFileName: upload.fileName,
        mimeType: upload.mimeType,
        convertedMimeType: 'image/webp',
        originalPath: originalRelativePath,
        convertedPath: convertedRelativePath,
        status: IMAGE_STATUS.QUEUED,
        error: null,
        createdAt: now,
        updatedAt: now
    };
}

async function runImageConversion(projectId, assetId) {
    const jobKey = `${projectId}:${assetId}`;
    const currentAsset = getImageAsset(projectId, assetId);
    if (!currentAsset) return null;

    updateImageAsset(projectId, assetId, {
        status: IMAGE_STATUS.CONVERTING,
        error: null
    });

    try {
        const latestAsset = getImageAsset(projectId, assetId);
        const originalPath = getProjectRelativePath(projectId, latestAsset.originalPath);
        const convertedPath = getProjectRelativePath(projectId, latestAsset.convertedPath);

        ensureDir(path.dirname(convertedPath));
        await sharp(originalPath)
            .rotate()
            .webp({ quality: 82 })
            .toFile(convertedPath);

        if (fs.existsSync(originalPath)) {
            fs.rmSync(originalPath, { force: true });
        }

        return updateImageAsset(projectId, assetId, {
            status: IMAGE_STATUS.READY,
            error: null,
            originalPath: null
        });
    } catch (err) {
        return updateImageAsset(projectId, assetId, {
            status: IMAGE_STATUS.FAILED,
            error: err.message
        });
    } finally {
        activeImageConversions.delete(jobKey);
    }
}

function queueImageConversion(projectId, assetId) {
    const jobKey = `${projectId}:${assetId}`;
    if (activeImageConversions.has(jobKey)) {
        return activeImageConversions.get(jobKey);
    }

    const job = Promise.resolve().then(() => runImageConversion(projectId, assetId));
    activeImageConversions.set(jobKey, job);
    return job;
}

function resumePendingImageConversions() {
    getProjectsIndex().projects.forEach((project) => {
        const index = getProjectImageIndex(project.id);
        Object.values(index.assets).forEach((asset) => {
            if (!asset || !asset.assetId) return;
            if (![IMAGE_STATUS.QUEUED, IMAGE_STATUS.CONVERTING].includes(asset.status)) return;
            if (!asset.originalPath) return;

            const originalPath = getProjectRelativePath(project.id, asset.originalPath);
            if (!fs.existsSync(originalPath)) {
                updateImageAsset(project.id, asset.assetId, {
                    status: IMAGE_STATUS.FAILED,
                    error: 'Original upload missing before conversion resumed'
                });
                return;
            }

            queueImageConversion(project.id, asset.assetId);
        });
    });
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
    ensureProjectImageStorage(projectId);
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
resumePendingImageConversions();

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

app.post('/api/projects/:projectId/images/upload', (req, res) => {
    const projectId = req.params.projectId;
    if (!isValidProjectId(projectId) || !fs.existsSync(getProjectDir(projectId))) {
        return res.status(400).json({ error: 'Invalid project id' });
    }

    try {
        const upload = parseImageUploadBody(req.body);
        const asset = buildImageAssetMeta(projectId, upload);
        const originalPath = getProjectRelativePath(projectId, asset.originalPath);

        ensureProjectImageStorage(projectId);
        fs.writeFileSync(originalPath, upload.buffer);
        setImageAsset(projectId, asset.assetId, asset);
        queueImageConversion(projectId, asset.assetId);

        res.status(202).json({
            status: 'accepted',
            asset: serializeImageAsset(projectId, asset)
        });
    } catch (err) {
        console.error('[POST /api/projects/:projectId/images/upload]', err);
        res.status(400).json({ error: err.message || 'Failed to upload image' });
    }
});

app.get('/api/projects/:projectId/images/:assetId/status', (req, res) => {
    const projectId = req.params.projectId;
    const assetId = req.params.assetId;

    if (!isValidProjectId(projectId)) {
        return res.status(400).json({ error: 'Invalid project id' });
    }

    const asset = getImageAsset(projectId, assetId);
    if (!asset) {
        return res.status(404).json({ error: 'Image asset not found' });
    }

    res.json({
        status: 'success',
        asset: serializeImageAsset(projectId, asset)
    });
});

app.get('/api/projects/:projectId/images/:assetId/file', (req, res) => {
    const projectId = req.params.projectId;
    const assetId = req.params.assetId;

    if (!isValidProjectId(projectId)) {
        return res.status(400).json({ error: 'Invalid project id' });
    }

    const asset = getImageAsset(projectId, assetId);
    if (!asset) {
        return res.status(404).json({ error: 'Image asset not found' });
    }

    if (asset.status === IMAGE_STATUS.READY && asset.convertedPath) {
        const convertedPath = getProjectRelativePath(projectId, asset.convertedPath);
        if (fs.existsSync(convertedPath)) {
            return res.sendFile(convertedPath);
        }
    }

    if (asset.originalPath) {
        const originalPath = getProjectRelativePath(projectId, asset.originalPath);
        if (fs.existsSync(originalPath)) {
            return res.sendFile(originalPath);
        }
    }

    return res.status(409).json({ error: 'Converted image is not ready yet', asset: serializeImageAsset(projectId, asset) });
});

app.get('/api/projects/:projectId/images/:assetId/original', (req, res) => {
    const projectId = req.params.projectId;
    const assetId = req.params.assetId;

    if (!isValidProjectId(projectId)) {
        return res.status(400).json({ error: 'Invalid project id' });
    }

    const asset = getImageAsset(projectId, assetId);
    if (!asset || !asset.originalPath) {
        return res.status(404).json({ error: 'Original image not found' });
    }

    const originalPath = getProjectRelativePath(projectId, asset.originalPath);
    if (!fs.existsSync(originalPath)) {
        return res.status(404).json({ error: 'Original image not found' });
    }

    res.sendFile(originalPath);
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
