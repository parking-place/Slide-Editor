'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 8000;
const ROOT = path.join(__dirname, '..'); // /app (프로젝트 루트)
const IMAGE_DATA_DIR = path.join(ROOT, 'data', 'image_data');

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
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

function normalizeStoredImagePath(imagePath) {
    if (typeof imagePath !== 'string') return imagePath;
    return imagePath.replace(/\\/g, '/').replace(/^\.?\/?data\/image_data\//, '/data/image_data/');
}

function persistInlineImage(imageValue) {
    if (typeof imageValue !== 'string' || !imageValue.startsWith('data:image/')) {
        return normalizeStoredImagePath(imageValue);
    }

    const matched = imageValue.match(/^data:(image\/[a-zA-Z0-9.+-]+(?:\+xml)?);base64,(.+)$/);
    if (!matched) {
        return imageValue;
    }

    const mimeType = matched[1];
    const base64Data = matched[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imageHash = crypto.createHash('sha1').update(imageBuffer).digest('hex');
    const imageFileName = `${imageHash}.${getImageExtension(mimeType)}`;
    const imagePath = path.join(IMAGE_DATA_DIR, imageFileName);

    ensureDir(IMAGE_DATA_DIR);
    if (!fs.existsSync(imagePath)) {
        fs.writeFileSync(imagePath, imageBuffer);
    }

    return `/data/image_data/${imageFileName}`;
}

function prepareSlidesForSave(slides) {
    if (!Array.isArray(slides)) return slides;
    return slides.map(slide => {
        if (!slide || typeof slide !== 'object') return slide;
        return Object.assign({}, slide, {
            image: persistInlineImage(slide.image)
        });
    });
}

function normalizeSavePayload(body) {
    const payload = typeof body === 'string' ? JSON.parse(body) : body;
    if (Array.isArray(payload)) {
        return prepareSlidesForSave(payload);
    }
    if (payload && typeof payload === 'object' && Array.isArray(payload.slides)) {
        return Object.assign({}, payload, {
            slides: prepareSlidesForSave(payload.slides)
        });
    }
    return payload;
}

// ── 미들웨어 ──────────────────────────────────────────────────
// CORS 및 캐시 억제 헤더 (기존 PowerShell 서버 동일)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// 경로 탈출(..) 방어 미들웨어
app.use((req, res, next) => {
    if (req.path.includes('..')) {
        return res.status(400).json({ error: 'Invalid path' });
    }
    next();
});

// JSON 바디 파서 (POST API용)
app.use(express.json({ limit: '50mb' }));
app.use(express.text({
    limit: '50mb',
    type: ['text/plain', 'text/html', 'application/xhtml+xml']
}));

// ── API 라우트 ────────────────────────────────────────────────

/**
 * GET /api/themes
 * data/themes/ 안의 .slidetheme 파일 목록 반환
 */
app.get('/api/themes', (req, res) => {
    const themesDir = path.join(ROOT, 'data', 'themes');
    fs.mkdirSync(themesDir, { recursive: true });
    try {
        const files = fs.readdirSync(themesDir)
            .filter(f => f.endsWith('.slidetheme'));
        res.json(files);
    } catch (err) {
        console.error('[GET /api/themes]', err);
        res.status(500).json({ error: 'Failed to read themes directory' });
    }
});

/**
 * GET /api/themes/:name
 * 특정 .slidetheme 파일 내용 반환
 */
app.get('/api/themes/:name', (req, res) => {
    const name = req.params.name;
    if (!name.endsWith('.slidetheme') || name.includes('..')) {
        return res.status(400).json({ error: 'Invalid theme name' });
    }
    const filePath = path.join(ROOT, 'data', 'themes', name);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Theme not found' });
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.send(content);
    } catch (err) {
        console.error('[GET /api/themes/:name]', err);
        res.status(500).json({ error: 'Failed to read theme file' });
    }
});

/**
 * POST /api/themes/:name
 * .slidetheme 파일 저장 (신규/덮어쓰기)
 */
app.post('/api/themes/:name', (req, res) => {
    const name = req.params.name;
    if (!name.endsWith('.slidetheme') || name.includes('..')) {
        return res.status(400).json({ error: 'Invalid theme name' });
    }
    const themesDir = path.join(ROOT, 'data', 'themes');
    fs.mkdirSync(themesDir, { recursive: true });
    const filePath = path.join(themesDir, name);
    try {
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);
        fs.writeFileSync(filePath, body, 'utf8');
        res.json({ status: 'success' });
    } catch (err) {
        console.error('[POST /api/themes/:name]', err);
        res.status(500).json({ error: 'Failed to save theme file' });
    }
});

/**
 * POST /api/save
 * slide_data.json 저장
 */
app.post('/api/save', (req, res) => {
    const savePath = path.join(ROOT, 'data', 'slide_data.json');
    try {
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        const payload = normalizeSavePayload(req.body);
        fs.writeFileSync(savePath, JSON.stringify(payload, null, 2), 'utf8');
        res.json({ status: 'success' });
    } catch (err) {
        console.error('[POST /api/save]', err);
        res.status(500).json({ error: 'Failed to save slide data' });
    }
});

/**
 * POST /api/saveHtml
 * 웹 가이드 HTML 파일 exports/ 경로에 저장
 */
app.post('/api/saveHtml', (req, res) => {
    const exportsDir = path.join(ROOT, 'exports');
    fs.mkdirSync(exportsDir, { recursive: true });
    const savePath = path.join(exportsDir, 'SlideEditor_Web_Guide.html');
    try {
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

// ── 정적 파일 서빙 ─────────────────────────────────────────────
// 루트 URL → SlideEditor.html 로 리다이렉트
app.get('/', (req, res) => {
    res.redirect('/SlideEditor.html');
});

// 나머지 모든 경로는 프로젝트 루트의 정적 파일로 서빙
app.use(express.static(ROOT, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}));

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.path}` });
});

// ── 서버 시작 ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log('===============================================');
    console.log('       Slide Editor Server (Docker/Node.js)');
    console.log('===============================================');
    console.log(`  -> 서버 주소: http://0.0.0.0:${PORT}/`);
    console.log(`  -> 에디터:    http://localhost:${PORT}/SlideEditor.html`);
    console.log('  -> Ctrl+C 로 서버를 중지합니다.');
    console.log('===============================================');
});
