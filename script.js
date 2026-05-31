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

    const DB_NAME = 'SignLanguageDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'videos';

    let db = null;

    // 打开 IndexedDB
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => {
                db = e.target.result;
                resolve(db);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // 保存视频到 IndexedDB
    function saveVideoToDB(file) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB not ready');
            const reader = new FileReader();
            reader.onload = (e) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put({ id: 'demo_video', data: e.target.result, name: file.name, type: file.type });
                tx.oncomplete = () => resolve();
                tx.onerror = (e) => reject(e.target.error);
            };
            reader.readAsDataURL(file);
        });
    }

    // 从 IndexedDB 加载视频
    function loadVideoFromDB() {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB not ready');
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get('demo_video');
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // 处理视频文件
    function handleVideo(file) {
        if (!file) return;

        uploadArea.style.display = 'none';
        uploadProgress.style.display = 'block';
        resultCard.style.display = 'none';

        // 模拟保存进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    videoPreview.style.display = 'block';
                    player.src = URL.createObjectURL(file);
                    player.load();

                    // 保存到 IndexedDB
                    saveVideoToDB(file).catch(console.warn);
                }, 300);
            }
            progressFill.style.width = progress + '%';
        }, 100);
    }

    // 恢复已保存的视频
    async function restoreVideo() {
        try {
            const saved = await loadVideoFromDB();
            if (saved && saved.data) {
                uploadArea.style.display = 'none';
                videoPreview.style.display = 'block';
                player.src = saved.data;
                player.load();
            }
        } catch (e) {
            console.log('No saved video found');
        }
    }

    // 初始化
    openDB().then(() => {
        restoreVideo();
    }).catch(console.warn);

    // 点击上传
    uploadArea.addEventListener('click', () => videoInput.click());

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            handleVideo(file);
        }
    });

    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleVideo(file);
    });

    // 更换视频
    changeVideoBtn.addEventListener('click', () => {
        videoInput.click();
    });

    // 模拟识别
    recognizeBtn.addEventListener('click', () => {
        const gestures = ['你好', '谢谢', '再见', '对不起', '没关系', '是', '不是', '好', '不好', '请'];
        const confidences = [0.72, 0.85, 0.91, 0.78, 0.88, 0.95, 0.69, 0.82, 0.76, 0.90];
        const idx = Math.floor(Math.random() * gestures.length);

        resultCard.style.display = 'block';
        recognizedText.textContent = gestures[idx];

        // 置信度动画
        setTimeout(() => {
            confidenceFill.style.width = (confidences[idx] * 100) + '%';
            confidenceValue.textContent = (confidences[idx] * 100).toFixed(1) + '%';
        }, 200);

        // 滚动到结果
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});
