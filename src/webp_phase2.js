(function () {
    'use strict';

    const IMAGE_ASSET_POLLERS = new Map();
    const IMAGE_ASSET_WAITERS = new Map();
    let legacyImageBackfillRunId = 0;

    function isImageAssetFilePath(imageValue) {
        return typeof imageValue === 'string' && /^\/api\/projects\/[^/]+\/images\/[^/]+\/file$/.test(imageValue.replace(/\\/g, '/'));
    }

    function isImageAssetOriginalPath(imageValue) {
        return typeof imageValue === 'string' && /^\/api\/projects\/[^/]+\/images\/[^/]+\/original$/.test(imageValue.replace(/\\/g, '/'));
    }

    const originalIsStoredImagePath = isStoredImagePath;
    isStoredImagePath = function (imageValue) {
        return originalIsStoredImagePath(imageValue)
            || isImageAssetFilePath(imageValue)
            || isImageAssetOriginalPath(imageValue);
    };

    function setUploadStatus(statusEl, text, state) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.dataset.state = state || 'idle';
    }

    function mergeSlideImageAsset(slide, asset) {
        if (!slide || !asset) return;
        slide.imageAsset = asset;

        if (asset.status === 'failed' && asset.originalUrl) {
            slide.image = asset.originalUrl;
            return;
        }

        if (asset.fileUrl) {
            slide.image = asset.fileUrl;
        }
    }

    function stopImageAssetPolling(assetId) {
        if (!assetId || !IMAGE_ASSET_POLLERS.has(assetId)) return;
        clearInterval(IMAGE_ASSET_POLLERS.get(assetId));
        IMAGE_ASSET_POLLERS.delete(assetId);
    }

    function queueImageAssetWaiter(assetId, resolve) {
        if (!assetId || typeof resolve !== 'function') return;
        const waiters = IMAGE_ASSET_WAITERS.get(assetId) || [];
        waiters.push(resolve);
        IMAGE_ASSET_WAITERS.set(assetId, waiters);
    }

    function resolveImageAssetWaiters(assetId, asset) {
        if (!assetId || !IMAGE_ASSET_WAITERS.has(assetId)) return;
        const waiters = IMAGE_ASSET_WAITERS.get(assetId) || [];
        IMAGE_ASSET_WAITERS.delete(assetId);
        waiters.forEach((resolve) => resolve(asset));
    }

    window.cancelLegacyImageBackfill = function () {
        legacyImageBackfillRunId += 1;
    };

    async function uploadImageFile(file, statusEl) {
        if (!currentProject || !currentProject.id) {
            throw new Error('현재 프로젝트가 없습니다.');
        }

        setUploadStatus(statusEl, '업로드 중...', 'uploading');
        const dataUrl = await blobToDataUrl(file);
        const payload = await requestJson(`/api/projects/${encodeURIComponent(currentProject.id)}/images/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                mimeType: file.type,
                dataUrl
            })
        });

        setUploadStatus(statusEl, 'WebP 변환 대기 중...', 'processing');
        return payload.asset;
    }

    function createLegacyPlaceholderAsset(runId, slideIndex) {
        return {
            assetId: `legacy-backfill-${runId}-${slideIndex}`,
            status: 'queued',
            error: null,
            fileUrl: null,
            originalUrl: null,
            isPlaceholder: true
        };
    }

    function isLegacyConvertibleSlide(slide) {
        if (!slide || typeof slide !== 'object') return false;
        if (slide.imageAsset && slide.imageAsset.assetId) return false;
        if (typeof slide.image !== 'string' || slide.image.trim() === '') return false;
        return isInlineImageData(slide.image) || originalIsStoredImagePath(slide.image);
    }

    function getLegacyImageMimeType(imageValue, blob) {
        if (blob && blob.type) {
            return blob.type;
        }

        if (typeof imageValue === 'string') {
            const matched = imageValue.match(/^data:(image\/[a-zA-Z0-9.+-]+(?:\+xml)?);base64,/);
            if (matched) {
                return matched[1];
            }
        }

        return 'image/png';
    }

    function sanitizeLegacyFileName(value, fallback) {
        const safeValue = String(value || '').trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return safeValue || fallback;
    }

    function getMimeExtension(mimeType) {
        if (!mimeType || typeof mimeType !== 'string') {
            return 'png';
        }

        const normalized = mimeType.toLowerCase();
        if (normalized === 'image/jpeg') return 'jpg';
        if (normalized === 'image/svg+xml') return 'svg';

        const parts = normalized.split('/');
        return (parts[1] || 'png').replace('+xml', '');
    }

    async function buildLegacyImageFile(candidate) {
        const sourceValue = candidate.sourceImage;
        const imageSrc = isInlineImageData(sourceValue) ? sourceValue : getSlideImageSrc(sourceValue);
        if (!imageSrc) {
            throw new Error('변환할 이미지를 찾을 수 없습니다.');
        }

        const response = await fetch(imageSrc, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`이미지를 불러오지 못했습니다. (${response.status})`);
        }

        const blob = await response.blob();
        const mimeType = getLegacyImageMimeType(sourceValue, blob);
        const extension = getMimeExtension(mimeType);
        const baseName = sanitizeLegacyFileName(candidate.slide.title, `slide-${candidate.index + 1}`);
        return new File([blob], `${baseName}.${extension}`, { type: mimeType });
    }

    function waitForImageAssetSettlement(slide, asset) {
        if (!slide || !asset || !asset.assetId) {
            return Promise.resolve(asset);
        }

        if (asset.status === 'ready' || asset.status === 'failed') {
            return Promise.resolve(asset);
        }

        beginImageAssetPolling(slide, asset);
        return new Promise((resolve) => {
            queueImageAssetWaiter(asset.assetId, resolve);
        });
    }

    async function silentlyPersistCurrentProject() {
        if (!currentProject || !currentProject.id) return false;

        await requestJson(`/api/projects/${encodeURIComponent(currentProject.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                settings: projectSettings,
                slides: slidesData
            })
        });

        return true;
    }

    function isLegacyBackfillRunActive(runId, projectId) {
        return legacyImageBackfillRunId === runId && currentProject && currentProject.id === projectId;
    }

    window.startLegacyImageBackfill = async function (options = {}) {
        if (!currentProject || !currentProject.id) {
            return { started: false, convertedCount: 0, failedCount: 0 };
        }

        const projectId = currentProject.id;
        const candidates = slidesData
            .map((slide, index) => ({
                slide,
                index,
                sourceImage: slide && slide.image
            }))
            .filter(({ slide }) => isLegacyConvertibleSlide(slide));

        if (candidates.length === 0) {
            return { started: false, convertedCount: 0, failedCount: 0 };
        }

        legacyImageBackfillRunId += 1;
        const runId = legacyImageBackfillRunId;

        candidates.forEach((candidate) => {
            candidate.slide.imageAsset = createLegacyPlaceholderAsset(runId, candidate.index);
        });
        window.renderPreview();

        let convertedCount = 0;
        let failedCount = 0;

        for (const candidate of candidates) {
            if (!isLegacyBackfillRunActive(runId, projectId)) {
                return { started: true, convertedCount, failedCount, cancelled: true };
            }

            try {
                const file = await buildLegacyImageFile(candidate);
                if (!isLegacyBackfillRunActive(runId, projectId)) {
                    return { started: true, convertedCount, failedCount, cancelled: true };
                }

                const asset = await uploadImageFile(file, null);
                mergeSlideImageAsset(candidate.slide, asset);
                window.renderPreview();

                const settledAsset = await waitForImageAssetSettlement(candidate.slide, asset);
                if (!isLegacyBackfillRunActive(runId, projectId)) {
                    return { started: true, convertedCount, failedCount, cancelled: true };
                }

                if (settledAsset && settledAsset.status === 'ready') {
                    convertedCount += 1;
                } else {
                    failedCount += 1;
                }
            } catch (error) {
                candidate.slide.imageAsset = Object.assign({}, candidate.slide.imageAsset || {}, {
                    status: 'failed',
                    error: error.message,
                    originalUrl: getSlideImageSrc(candidate.sourceImage)
                });
                failedCount += 1;
                window.renderPreview();
            }
        }

        if (!isLegacyBackfillRunActive(runId, projectId)) {
            return { started: true, convertedCount, failedCount, cancelled: true };
        }

        if (options.persistAfterConversion) {
            try {
                await silentlyPersistCurrentProject();
            } catch (persistError) {
                console.warn('[legacy-backfill] 자동 저장에 실패했습니다.', persistError);
            }
        }

        const totalCount = convertedCount + failedCount;
        if (options.notify !== false && totalCount > 0) {
            const message = failedCount > 0
                ? `구버전 이미지 WebP 변환이 완료되었습니다.\n성공 ${convertedCount}개 / 실패 ${failedCount}개`
                : `구버전 이미지 ${convertedCount}개의 WebP 변환이 완료되었습니다.`;
            showModal(options.completionMessage || message);
        }

        return { started: true, convertedCount, failedCount };
    };

    function getSlideVisualImageState(slide) {
        const asset = slide && slide.imageAsset;

        if (asset && (asset.status === 'queued' || asset.status === 'converting')) {
            return {
                state: 'converting',
                src: null,
                message: 'WebP로 변환 중...'
            };
        }

        if (asset && asset.status === 'failed') {
            return {
                state: 'failed',
                src: asset.originalUrl || asset.fileUrl || getSlideImageSrc(slide.image),
                message: '변환 실패 - 원본 사용'
            };
        }

        return {
            state: 'ready',
            src: (asset && asset.fileUrl) || getSlideImageSrc(slide && slide.image),
            message: ''
        };
    }

    function renderImageStateBox(imageBox, slide, state) {
        if (!imageBox || !state || state.state === 'ready') return;

        const captionHtml = slide && slide.imageCaption
            ? `<div class="image-processing-caption">${escapeHtml(slide.imageCaption)}</div>`
            : '';

        if (state.state === 'converting') {
            imageBox.innerHTML = `
                <div class="image-processing-state">
                    <i class="fa-solid fa-arrows-rotate fa-spin"></i>
                    <strong>변환 중</strong>
                    <span>${state.message}</span>
                </div>
                ${captionHtml}
            `;
            imageBox.classList.add('image-processing-box');
            return;
        }

        if (state.state === 'failed') {
            imageBox.innerHTML = `
                ${state.src ? `<img src="${state.src}" alt="Slide Image" onclick="window.openImageModal(this.src)" title="클릭하여 원본 보기">` : ''}
                <div class="image-processing-state image-processing-failed">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <strong>${state.message}</strong>
                </div>
                ${captionHtml}
            `;
            imageBox.classList.add('image-processing-box');
        }
    }

    function decorateRenderedSlides() {
        slidesData.forEach((slide, index) => {
            const previewSlide = document.getElementById(`preview-slide-${index}`);
            if (!previewSlide) return;

            const imageBox = previewSlide.querySelector('.image-box');
            if (!imageBox) return;

            imageBox.classList.remove('image-processing-box');
            const state = getSlideVisualImageState(slide);
            renderImageStateBox(imageBox, slide, state);
        });
    }

    function beginImageAssetPolling(slide, asset) {
        if (!slide || !asset || !asset.assetId || !currentProject || !currentProject.id) return;
        if (asset.isPlaceholder) return;
        if (!['queued', 'converting'].includes(asset.status)) return;

        stopImageAssetPolling(asset.assetId);

        const intervalId = window.setInterval(async () => {
            try {
                const payload = await requestJson(`/api/projects/${encodeURIComponent(currentProject.id)}/images/${encodeURIComponent(asset.assetId)}/status`);
                const nextAsset = payload.asset;
                mergeSlideImageAsset(slide, nextAsset);

                if (nextAsset.status === 'ready' || nextAsset.status === 'failed') {
                    stopImageAssetPolling(asset.assetId);
                    resolveImageAssetWaiters(nextAsset.assetId, nextAsset);
                    window.renderPreview();
                }
            } catch (error) {
                stopImageAssetPolling(asset.assetId);
                const failedAsset = Object.assign({}, slide.imageAsset || asset, {
                    status: 'failed',
                    error: error.message
                });
                slide.imageAsset = failedAsset;
                resolveImageAssetWaiters(asset.assetId, failedAsset);
                window.renderPreview();
            }
        }, 1200);

        IMAGE_ASSET_POLLERS.set(asset.assetId, intervalId);
    }

    function resumePendingImageAssets() {
        slidesData.forEach((slide) => {
            if (!slide || !slide.imageAsset || !slide.imageAsset.assetId) return;
            beginImageAssetPolling(slide, slide.imageAsset);
        });
    }

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        decorateRenderedSlides();
        resumePendingImageAssets();
    };

    window.insertNewSlide = async function (insertIndex) {
        const chapter = document.getElementById('input-chapter').value.trim() || '대제목 미지정';
        const middleTitle = document.getElementById('input-middle-title').value.trim();
        const title = document.getElementById('input-title').value.trim() || '제목 없음';
        const text = document.getElementById('input-text').value.trim();
        const imageInput = document.getElementById('input-image');
        const imageStatus = document.getElementById('input-image-status');
        const imageCaption = document.getElementById('input-image-caption').value.trim();
        const textRatioInput = document.getElementById('input-text-ratio');
        const textRatio = textRatioInput ? parseInt(textRatioInput.value, 10) : 50;

        try {
            const nextSlide = { chapter, middleTitle, title, text, imageCaption, image: null, textRatio };

            if (imageInput.files && imageInput.files[0]) {
                const asset = await uploadImageFile(imageInput.files[0], imageStatus);
                mergeSlideImageAsset(nextSlide, asset);
            }

            slidesData.splice(insertIndex, 0, nextSlide);
            if (nextSlide.imageAsset) {
                beginImageAssetPolling(nextSlide, nextSlide.imageAsset);
            }

            activeEditorIndex = null;
            window.renderPreview();
        } catch (error) {
            setUploadStatus(imageStatus, error.message || '이미지 업로드 실패', 'error');
            showModal('이미지 업로드 중 오류가 발생했습니다.\n' + error.message);
        }
    };

    window.saveEditSlide = async function (index) {
        const chapter = document.getElementById('edit-chapter').value.trim() || '대제목 미지정';
        const middleTitle = document.getElementById('edit-middle-title').value.trim();
        const title = document.getElementById('edit-title').value.trim() || '제목 없음';
        const text = document.getElementById('edit-text').value.trim();
        const imageInput = document.getElementById('edit-image');
        const imageStatus = document.getElementById('edit-image-status');
        const imageCaption = document.getElementById('edit-image-caption').value.trim();
        const deleteImageChecked = document.getElementById('edit-delete-image') && document.getElementById('edit-delete-image').checked;
        const textRatioInput = document.getElementById('edit-text-ratio');
        const textRatio = textRatioInput ? parseInt(textRatioInput.value, 10) : 50;
        const previousSlide = slidesData[index];

        try {
            if (previousSlide && previousSlide.imageAsset && previousSlide.imageAsset.assetId) {
                stopImageAssetPolling(previousSlide.imageAsset.assetId);
            }

            const nextSlide = {
                chapter,
                middleTitle,
                title,
                text,
                imageCaption,
                image: deleteImageChecked ? null : previousSlide.image,
                imageAsset: deleteImageChecked ? null : (previousSlide.imageAsset || null),
                textRatio
            };

            if (imageInput.files && imageInput.files[0]) {
                const asset = await uploadImageFile(imageInput.files[0], imageStatus);
                mergeSlideImageAsset(nextSlide, asset);
            }

            slidesData[index] = nextSlide;
            if (nextSlide.imageAsset) {
                beginImageAssetPolling(nextSlide, nextSlide.imageAsset);
            }

            editingSlideIndex = null;
            window.renderPreview();
        } catch (error) {
            setUploadStatus(imageStatus, error.message || '이미지 업로드 실패', 'error');
            showModal('이미지 업로드 중 오류가 발생했습니다.\n' + error.message);
        }
    };
})();
