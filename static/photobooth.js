const gestureModal = document.getElementById('gestureModal');
const enableGestureBtn = document.querySelector('.enableGestureBtn');
const disabledGestureBtn = document.querySelector('.disabledGestureBtn');
const videoOverlay = document.getElementById('video-overlay');
let gestureEnabled = false;
let hands, camera;
function drawHandTracking(results) {
    const video2d = videoOverlay.getContext('2d');
    video2d.clearRect(0, 0, videoOverlay.width, videoOverlay.height);
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            for (const point of landmarks) {
                video2d.beginPath();
                video2d.arc(point.x * videoOverlay.width, point.y * videoOverlay.height, 8, 0, 2 * Math.PI);
                video2d.fillStyle = 'rgba(255,0,0,0.7)';
                video2d.fill();
            }
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    if (gestureModal) gestureModal.classList.add('modal_visible');
    if (videoOverlay) {
        videoOverlay.style.display = 'none';
    }
    if (enableGestureBtn) {
        enableGestureBtn.addEventListener('click', async () => {
            gestureEnabled = true;
            gestureModal.classList.remove('modal_visible');
            startHandGesture();
        });
    }
    if (disabledGestureBtn) {
        disabledGestureBtn.addEventListener('click', () => {
            gestureEnabled = false;
            gestureModal.classList.remove('modal_visible');
            stopHandGesture();
        });
    }
});
function startHandGesture() {
    if (videoOverlay) {
        videoOverlay.style.display = 'block';
        videoOverlay.width = video.videoWidth || 1200;
        videoOverlay.height = video.videoHeight || 692;
    }
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    hands.onResults(drawHandTracking);
    camera = new Camera(video, {
        onFrame: async () => {
            await hands.send({ image: video });
        },
        width: 1200,
        height: 692
    });
    camera.start();
}

function stopHandGesture() {
    if (camera) {
        camera.stop();
    }
    if (videoOverlay) {
        videoOverlay.style.display = 'none';
    }
    gestureEnabled = false;
}
async function capturePhoto() {
    if (gestureEnabled && videoOverlay) {
        videoOverlay.style.display = 'none';
        setTimeout(() => {
            if (videoOverlay) videoOverlay.style.display = 'block';
        }, 800);
    }
}

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const canvas2d = canvas.getContext('2d');
const ambil = document.getElementById('ambil');
const timer = document.getElementById('timer');
const cameraStatusText = document.getElementById('camera-status-text');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
const instructionsModal = document.getElementById('instructionsModal');
const frameConfig = {
  'frame1.png': [
    { x: 15, y: 30, width: 260, height: 150 },
    { x: 15, y: 190, width: 260, height: 150 },
    { x: 15, y: 360, width: 260, height: 150 },
    { x: 15, y: 520, width: 260, height: 150},
  ],
  'frame2.png': [
    { x: 15, y: 70, width: 260, height: 145 },
    { x: 15, y: 245, width: 260, height: 145 },
    { x: 15, y: 420, width: 260, height: 145 },
    { x: 15, y: 595, width: 260, height: 145},
  ],
  'frame3.png': [
    { x: 15, y: 159, width: 260, height: 155 },
    { x: 15, y: 324, width: 260, height: 155 },
    { x: 15, y: 488, width: 260, height: 155 },
    { x: 15, y: 652, width: 260, height: 155},
  ],
  'frame4.png': [
    { x: 15, y: 171, width: 260, height: 150 },
    { x: 15, y: 332, width: 260, height: 150 },
    { x: 15, y: 490, width: 260, height: 150 },
    { x: 15, y: 645, width: 260, height: 150},
  ],
};
let cameraStream = null;
async function requestCameraPermission() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser tidak mendukung akses kamera');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1200 },
                height: { ideal: 620 },
                facingMode: 'user'
            },
            audio: false
        });
        video.srcObject = stream;
        cameraStream = stream;
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
        cameraStatusText.textContent = 'Kamera Aktif';
        cameraStatusText.style.color = '#4CAF50';
        ambil.disabled = false;
        showSuccess('Kamera berhasil diaktifkan!');
        return true;
    } catch (error) {
        console.error('Error accessing camera:', error);
        let errorMessage = 'Gagal mengakses kamera';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Izin kamera ditolak. Silakan berikan izin kamera di pengaturan browser.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'Kamera tidak ditemukan. Pastikan kamera terhubung.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.';
        }
        cameraStatusText.textContent = 'Kamera Tidak Tersedia';
        cameraStatusText.style.color = '#f44336';
        showError(errorMessage);
        return false;
    }
}
async function initializeCamera() {
    console.log('Requesting camera permission...');
    await requestCameraPermission();
}
let selectedFrame = null;
document.querySelectorAll('.frame-button').forEach(button => {
    button.addEventListener('click', async () => {
        const frameName = button.getAttribute('data-frame');
        document.querySelectorAll('.frame-button').forEach(btn => {
            btn.classList.remove('aktif');
        });
        button.classList.add('aktif');
        selectedFrame = frameName;
        try {
            const response = await fetch('/select_frame', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ frame: frameName })
            });
            const result = await response.json();
            if (!result.success) {
                showError('Gagal memilih frame: ' + result.error);
            } else {
                showSuccess(`Frame ${frameName} dipilih!`);
            }
        } catch (error) {
            showError('Gagal memilih frame');
        }
    });
});
const countdown = document.getElementById('countdown');
function runCountdown(seconds) {
  return new Promise(resolve => {
        if (seconds <= 0) {
      resolve();
      return;
    }
    let count = seconds;
    countdown.textContent = count;
    countdown.style.display = 'block';
        
    const interval = setInterval(() => {
      count -= 1;
      if (count >= 0) {
        countdown.textContent = count;
      }
      if (count < 0) {
        clearInterval(interval);
        countdown.textContent = '';
                countdown.style.display = 'none';
        resolve();
      }
    }, 1000);
  });
}

let capturedPhotos = [];
async function capturePhoto() {
    if (!selectedFrame) {
        showError('Pilih frame terlebih dahulu!');
        return;
    }
    if (!cameraStream) {
        showError('Kamera belum diaktifkan!');
    return;
    }
    try {
        const timerValue = parseInt(timer.value) || 0;
        ambil.disabled = true;
        timer.disabled = true;
        if (timerValue > 0) {
            await runCountdown(timerValue);
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas2d.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        const response = await fetch('/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                timer: 0,
                photo_data: photoData.split(',')[1]
            })
        });
        const result = await response.json();

        if (result.success) {
            capturedPhotos.push({
                id: result.photo_id,
                data: result.photo_data,
                timestamp: new Date().toISOString()
            });
            updateCanvasPreview();
            showSuccess(`Foto ${result.total_photos} berhasil diambil!`);
            if (capturedPhotos.length >= 7) {
                showPhotoGallery();
            }
        } else {
            showError('Gagal mengambil foto: ' + result.error);
        }
    } catch (error) {
        console.error('Error capturing photo:', error);
        showError('Gagal mengambil foto');
    } finally {
        ambil.disabled = false;
        timer.disabled = false;
    }
}
function updateCanvasPreview() {
    if (capturedPhotos.length === 0) return;
    const fotoWidth = 150;
    const fotoHeight = 110;
    const gap = 10; 
    canvas.width = (fotoWidth * 7) + (gap * 6);
    canvas.height = fotoHeight;
    canvas2d.clearRect(0, 0, canvas.width, canvas.height);
    capturedPhotos.slice(0, 7).forEach((photo, i) => {
        const img = new Image();
        img.onload = () => {
            const x = i * (fotoWidth + gap);
            canvas2d.drawImage(img, x, 0, fotoWidth, fotoHeight);
        };
        img.src = 'data:image/jpeg;base64,' + photo.data;
    });

}
const galeri = document.getElementById('pilihanfoto');
let selectedPhotos = [];
function showPhotoGallery() {
    galeri.innerHTML = '';
    galeri.style.display = 'flex';
    capturedPhotos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = 'data:image/jpeg;base64,' + photo.data;
        img.className = 'foto-preview';
        img.setAttribute('data-index', index);
        img.addEventListener('click', () => {
            img.classList.toggle('selected');
            updateSelectedPhotos();
        });
        galeri.appendChild(img);
    });
}
const simpan = document.getElementById('simpan');
const unduh = document.getElementById('unduh');
const hasil = document.getElementById('hasil');
const hasilGabungan = hasil.getContext('2d');
function updateSelectedPhotos() {
    const selectedElements = document.querySelectorAll('.foto-preview.selected');
    selectedPhotos = Array.from(selectedElements).map(el => {
        const index = parseInt(el.getAttribute('data-index'));
        return capturedPhotos[index];
    });
    simpan.disabled = selectedPhotos.length !== 4;
}
simpan.addEventListener('click', async () => {
    if (selectedPhotos.length !== 4) {
        showError('Pilih tepat 4 foto!');
        return;
    }
    let frameW = 290, frameH = 821;
    if (selectedFrame === 'frame2.png') {
        frameH = 870;
    }
    hasil.width = frameW;
    hasil.height = frameH;
    hasilGabungan.clearRect(0, 0, hasil.width, hasil.height);
    const positions = frameConfig[selectedFrame];
    let loadedCount = 0;
    selectedPhotos.forEach((photo, i) => {
        const pos = positions[i];
        const img = new Image();
        img.onload = () => {
            const x = pos.x;
            const y = pos.y;
            const w = pos.width;
            const h = pos.height;

            let srcW = img.width;
            let srcH = img.height;
            let targetRatio = w / h;
            let srcRatio = srcW / srcH;
            let sx = 0, sy = 0, sw = srcW, sh = srcH;

            if (srcRatio > targetRatio) {
                sw = sh * targetRatio;
                sx = (srcW - sw) / 2;
            } else if (srcRatio < targetRatio) {
                sh = sw / targetRatio;
                sy = (srcH - sh) / 2;
            }
            hasilGabungan.drawImage(img, sx, sy, sw, sh, x, y, w, h);
            loadedCount++;
            if (loadedCount === 4) {
                const frameImg = new Image();
                frameImg.onload = () => {
                    hasilGabungan.drawImage(frameImg, 0, 0, frameW, frameH);
                    unduh.disabled = false;
                };
                frameImg.src = `/assets/${selectedFrame}`;
            }
        };
        img.src = 'data:image/jpeg;base64,' + photo.data;
    });
});

async function createComposition() {
    try {
        const response = await fetch('/create_composition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        if (result.success) {
            const img = new Image();
            img.onload = () => {
                hasil.width = 800;
                hasil.height = 600;
                hasilGabungan.drawImage(img, 0, 0, 800, 600);
                unduh.disabled = false;
            };
            img.src = 'data:image/jpeg;base64,' + result.composition_data;
            showSuccess('Komposisi foto berhasil dibuat!');
        } else {
            showError('Gagal membuat komposisi: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating composition:', error);
        showError('Gagal membuat komposisi');
    }
}

function downloadComposition(filename) {
    window.open(`/download/${filename}`, '_blank');
}

function downloadCanvasResult() {
    try {
        if (hasil.width === 0 || hasil.height === 0) {
            showError('Tidak ada hasil untuk diunduh');
            return;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `siphot_hasil_${timestamp}.jpg`;
        const dataURL = hasil.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Hasil berhasil diunduh!');  
    } catch (error) {
        showError('Gagal mengunduh hasil');
    }
}

async function resetSession() {
    try {
        const response = await fetch('/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        if (result.success) {
            capturedPhotos = [];
            selectedPhotos = [];
            galeri.innerHTML = '';
            galeri.style.display = 'none';
            canvas.width = 800;
            canvas.height = 180;
            canvas2d.clearRect(0, 0, canvas.width, canvas.height);
            hasil.width = 290;
            hasil.height = 150;
            hasilGabungan.clearRect(0, 0, hasil.width, hasil.height);
            simpan.disabled = true;
            unduh.disabled = true;
            showSuccess('Sesi berhasil direset!');
        } else {
            showError('Gagal mereset sesi: ' + result.error);
        }
    } catch (error) {
        console.error('Error resetting session:', error);
        showError('Gagal mereset sesi');
    }
}

ambil.addEventListener('click', async () => {
    if (capturedPhotos.length >= 7) {
        showError('Sudah mengambil 7 foto! Pilih 4 foto terbaik.');
        return;
    }
    ambil.disabled = true;
    timer.disabled = true;
    let timerValue = parseInt(timer.value) || 0;
    for (let i = capturedPhotos.length; i < 7; i++) {
        if (timerValue > 0) {
            await runCountdown(timerValue);
        }
        await capturePhotoAuto();
    }
    ambil.disabled = false;
    timer.disabled = false;
    showPhotoGallery();
});
async function capturePhotoAuto() {
    if (!cameraStream) {
        showError('Kamera belum diaktifkan!');
        return;
    }
    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(video, 0, 0);
        const photoData = tempCanvas.toDataURL('image/jpeg', 0.8);
        capturedPhotos.push({
            id: Date.now() + Math.random(),
            data: photoData.split(',')[1],
            timestamp: new Date().toISOString()
        });
        updateCanvasPreview();
    } catch (error) {
        console.error('Error capturing photo:', error);
        showError('Gagal mengambil foto');
    }
}
if (closeInstructionsBtn && instructionsModal) {
    closeInstructionsBtn.addEventListener('click', async () => {
        instructionsModal.style.display = 'none';
        await requestCameraPermission();
    });
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('SiPhot Photobooth initialized');
    if (!video || !canvas || !ambil || !timer || !simpan || !unduh || !hasil) {
        console.error('Required DOM elements not found');
        showError('Error: Required elements not found');
        return;
    }
    initializeCamera();
    simpan.disabled = true;
    unduh.disabled = true;
    unduh.addEventListener('click', downloadCanvasResult);
    
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSession);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        }
        .notification.success {
            background-color: #4CAF50;
        }
        
        .notification.error {
            background-color: #f44336;
        }
        .reset-btn {
            background: linear-gradient(135deg, #ff5722, #ff7043);
            color: white;
            border: none;
            padding: 10px 40px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .reset-btn:hover {
            background: linear-gradient(135deg, #ff7043, #ff5722);
            transform: translateY(-2px);
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});