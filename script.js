// ===== 可编辑字段（双击编辑 + IndexedDB 持久化） =====
(function() {
    const DB_NAME = 'SignLanguageDB';
    const DB_VERSION = 2;
    const STORE_NAME = 'profile';

    let db = null;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(STORE_NAME)) {
                    d.createObjectStore(STORE_NAME, { keyPath: 'field' });
                }
            };
            request.onsuccess = (e) => { db = e.target.result; resolve(db); };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function loadProfile() {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB not ready');
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = (e) => resolve(e.target.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function saveField(field, value) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB not ready');
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put({ field, value });
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    // 恢复所有已保存的字段
    async function restoreProfile() {
        try {
            const items = await loadProfile();
            items.forEach(({ field, value }) => {
                // 思路文本框特殊处理
                if (field === 'thought') {
                    const el = document.getElementById('thoughtEditor');
                    if (el) el.value = value;
                    return;
                }
                const el = document.querySelector(`.editable[data-field="${field}"]`);
                if (el) el.textContent = value;
            });
        } catch (e) {
            console.log('No saved profile found');
        }
    }

    // 使元素可编辑
    function makeEditable(el) {
        const field = el.dataset.field;
        const type = el.dataset.type || 'text';

        el.addEventListener('dblclick', () => {
            if (el.classList.contains('editing')) return;
            el.classList.add('editing');
            el.contentEditable = 'true';
            el.focus();

            // 全选文本
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });

        el.addEventListener('blur', () => {
            finishEdit(el, field);
        });

        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && type !== 'textarea') {
                e.preventDefault();
                el.blur();
            }
            if (e.key === 'Escape') {
                el.blur();
            }
        });

        // 点击其他地方自动保存
        document.addEventListener('click', (e) => {
            if (el.classList.contains('editing') && !el.contains(e.target)) {
                finishEdit(el, field);
            }
        });
    }

    function finishEdit(el, field) {
        if (!el.classList.contains('editing')) return;
        el.classList.remove('editing');
        el.contentEditable = 'false';

        const value = el.textContent.trim();
        saveField(field, value).then(() => {
            el.classList.add('saved');
            setTimeout(() => el.classList.remove('saved'), 600);
        }).catch(console.warn);
    }

    // 初始化所有可编辑元素
    openDB().then(() => {
        restoreProfile();
        document.querySelectorAll('.editable').forEach(makeEditable);
    }).catch(console.warn);
})();

// ===== 左侧导航切换 =====
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(item.dataset.section);
            if (target) target.classList.add('active');
        });
    });

    // ===== 思路文本框自动保存 =====
    const thoughtEditor = document.getElementById('thoughtEditor');
    if (thoughtEditor) {
        let thoughtTimer = null;
        thoughtEditor.addEventListener('input', () => {
            clearTimeout(thoughtTimer);
            thoughtTimer = setTimeout(() => {
                saveField('thought', thoughtEditor.value).catch(console.warn);
            }, 500);
        });
    }

    // ===== 视频上传 =====
    const uploadArea = document.getElementById('uploadArea');
    const videoInput = document.getElementById('videoInput');
    const videoPreview = document.getElementById('videoPreview');
    const player = document.getElementById('player');
    const changeVideoBtn = document.getElementById('changeVideoBtn');
    const recognizeBtn = document.getElementById('recognizeBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const resultCard = document.getElementById('resultCard');
    const recognizedText = document.getElementById('recognizedText');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');

    // 默认展示固定视频
    const defaultVideo = '手语识别.mp4';

    // 更换视频按钮
    changeVideoBtn.addEventListener('click', () => {
        videoInput.click();
    });

    function handleVideo(file) {
        if (!file) return;
        uploadProgress.style.display = 'block';
        resultCard.style.display = 'none';

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    player.src = URL.createObjectURL(file);
                    player.load();
                }, 300);
            }
            progressFill.style.width = progress + '%';
        }, 100);
    }

    uploadArea.addEventListener('click', () => videoInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) handleVideo(file);
    });
    videoInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) handleVideo(file); });

    // 模拟识别
    recognizeBtn.addEventListener('click', () => {
        const gestures = ['你好', '谢谢', '再见', '对不起', '没关系', '是', '不是', '好', '不好', '请'];
        const confidences = [0.72, 0.85, 0.91, 0.78, 0.88, 0.95, 0.69, 0.82, 0.76, 0.90];
        const idx = Math.floor(Math.random() * gestures.length);
        resultCard.style.display = 'block';
        recognizedText.textContent = gestures[idx];
        setTimeout(() => {
            confidenceFill.style.width = (confidences[idx] * 100) + '%';
            confidenceValue.textContent = (confidences[idx] * 100).toFixed(1) + '%';
        }, 200);
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});
