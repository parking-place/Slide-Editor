(function () {
    'use strict';

    let phase9Observer = null;

    function cloneTemplate(templateId) {
        const template = document.getElementById(templateId);
        if (!template) return null;
        return document.importNode(template.content.firstElementChild, true);
    }

    function scrollToSlide(index) {
        const target = document.getElementById(`preview-slide-${index}`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function buildTemplateToc() {
        const nav = document.getElementById('toc-navigator');
        if (!nav) return;

        nav.innerHTML = '<div class="toc-sidebar-title"><i class="fa-solid fa-list"></i> Navigator</div>';

        if (!slidesData.length) {
            const empty = document.createElement('div');
            empty.className = 'toc-sidebar-empty';
            empty.innerHTML = '<i class="fa-solid fa-file-circle-plus" style="font-size:22px; margin-bottom:8px; display:block;"></i>슬라이드를 추가하면<br>목차가 여기에 표시됩니다.';
            nav.appendChild(empty);
            return;
        }

        let prevChapter = null;
        let prevMiddleTitle = null;
        const firstTitleByKey = {};

        slidesData.forEach((slide, index) => {
            const chapter = slide.chapter || 'Untitled Chapter';
            const middleTitle = slide.middleTitle || '';
            const title = slide.title || `Slide ${index + 1}`;

            if (chapter !== prevChapter) {
                const chapterEl = cloneTemplate('phase9-toc-chapter-template');
                chapterEl.textContent = chapter;
                chapterEl.classList.add('phase9-template-item');
                nav.appendChild(chapterEl);
                prevChapter = chapter;
                prevMiddleTitle = null;
            }

            if (middleTitle && middleTitle !== prevMiddleTitle) {
                const middleEl = cloneTemplate('phase9-toc-middle-template');
                middleEl.textContent = middleTitle;
                middleEl.classList.add('phase9-template-item');
                middleEl.addEventListener('click', () => scrollToSlide(index));
                middleEl.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        scrollToSlide(index);
                    }
                });
                nav.appendChild(middleEl);
                prevMiddleTitle = middleTitle;
            }

            const key = `${chapter}||${middleTitle}||${title}`;
            if (!firstTitleByKey[key]) {
                const titleEl = cloneTemplate('phase9-toc-title-template');
                titleEl.textContent = title;
                titleEl.dataset.slide = String(index);
                titleEl.dataset.key = key;
                titleEl.classList.add('phase9-template-item');
                titleEl.addEventListener('click', () => scrollToSlide(index));
                titleEl.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        scrollToSlide(index);
                    }
                });
                nav.appendChild(titleEl);
                firstTitleByKey[key] = titleEl;
            }
        });

        bindActiveSlideObserver(firstTitleByKey);
    }

    function bindActiveSlideObserver(firstTitleByKey) {
        if (phase9Observer) {
            phase9Observer.disconnect();
        }

        phase9Observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const slideIndex = entry.target.id.replace('preview-slide-', '');
                const slide = slidesData[Number(slideIndex)];
                if (!slide) return;

                const key = `${slide.chapter || 'Untitled Chapter'}||${slide.middleTitle || ''}||${slide.title || `Slide ${Number(slideIndex) + 1}`}`;
                const activeEl = firstTitleByKey[key];
                if (!activeEl) return;

                document.querySelectorAll('.toc-nav-title.phase9-template-item').forEach((item) => {
                    item.classList.remove('active');
                    item.dataset.active = 'false';
                });
                activeEl.classList.add('active');
                activeEl.dataset.active = 'true';
            });
        }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

        document.querySelectorAll('.slide-preview[id^="preview-slide-"]').forEach((slideEl) => phase9Observer.observe(slideEl));
    }

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
        originalRenderPreview.apply(this, arguments);
        buildTemplateToc();
    };

    buildTemplateToc();
})();
