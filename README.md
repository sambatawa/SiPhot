# SiPhot - Photobooth dengan Hand Gesture Control

Aplikasi photobooth digital yang menggabungkan web interface modern dengan kontrol hand gesture untuk mouse menggunakan Python backend.

## 🚀 Fitur Utama

### Web Photobooth
- **Capture foto real-time** dengan frame overlay
- **Timer countdown** yang dapat disesuaikan (0-30 detik)
- **4 pilihan frame** yang berbeda dan menarik
- **Hand gesture control** untuk kontrol mouse tanpa menyentuh keyboard
- **Klik otomatis** dengan gesture jempol dan telunjuk
- **Preview foto** dengan galeri interaktif
- **Download hasil** dalam format JPEG berkualitas tinggi

### Hand Gesture Control
- **Mouse Movement**: Gerakan telunjuk menggerakkan mouse
- **Click**: Jempol + telunjuk bersentuhan = klik mouse
- **Visual Feedback**: Lingkaran kuning di ujung telunjuk, lingkaran merah saat klik
- **Real-time Detection**: Hand gesture langsung terlihat di video feed

## 🛠️ Instalasi & Setup

### Dependencies Python
```bash
pip install opencv-python
pip install mediapipe
pip install pyautogui
pip install flask
pip install numpy
```

### Menjalankan Aplikasi
1. **Start aplikasi**
   ```bash
   python App.py
   ```
2. **Pilih mode yang diinginkan**
   ```
   ==================================================
              SiPhot - Digital Photobooth
   ==================================================
   1. Web Photobooth Mode
   2. Exit
   ==================================================
   ```

## 📱 Cara Menggunakan

### Web Photobooth Mode
1. **Pilih "1" untuk Web Photobooth Mode**
2. **Buka browser** dan akses: `http://localhost:5000`
3. **Pilih Hand Gesture**: 
   - Klik "boleh" untuk mengaktifkan hand gesture
   - Klik "Tidak" untuk menggunakan mode normal
4. **Pilih frame** yang diinginkan dari 4 pilihan
5. **Atur timer** countdown (opsional, 0-30 detik)
6. **Klik "Ambil Foto"** untuk mengambil 7 foto otomatis
7. **Pilih 4 foto terbaik** dari galeri preview
8. **Download** hasil gabungan foto dengan frame

### Hand Gesture Control
- **Gerakkan telunjuk** untuk mengontrol posisi mouse
- **Sentuh jempol + telunjuk** untuk melakukan klik
- **Visual feedback** akan muncul di video feed

## 🔧 Arsitektur & Integrasi

### Frontend (HTML & JavaScript)
- **Video Feed Python**: Menggunakan `<img src="/video_feed">` dari Python backend
- **Modal Hand Gesture**: Interface untuk mengaktifkan/menonaktifkan hand gesture
- **API Calls**: Frontend mengirim request ke Python untuk mengontrol hand gesture
- **Responsive Design**: Interface yang responsif dan modern

### Backend (Python)
- **Hand Gesture Terintegrasi**: Hand gesture detection terintegrasi dalam `generate_frames()`
- **Kontrol via API**: 
  - `POST /hand_gesture` - Mengaktifkan hand gesture
  - `DELETE /hand_gesture` - Menonaktifkan hand gesture
- **Variabel Global**: `hand_gesture_enabled` untuk mengontrol status hand gesture

### Cara Kerja Hand Gesture

#### Saat Hand Gesture Aktif:
1. User klik "boleh" di modal
2. Frontend mengirim `POST /hand_gesture`
3. Python mengatur `hand_gesture_enabled = True`
4. Video feed menampilkan tracking tangan dengan MediaPipe
5. PyAutoGUI menggerakkan mouse sesuai gerakan tangan
6. Klik dilakukan dengan gesture jempol + telunjuk

#### Saat Hand Gesture Nonaktif:
1. User klik "Tidak" di modal
2. Frontend mengirim `DELETE /hand_gesture`
3. Python mengatur `hand_gesture_enabled = False`
4. Video feed normal tanpa tracking tangan

### Fitur Hand Gesture Python

```python
def deteksi_tangan(image):
    # MediaPipe untuk deteksi tangan
    # Landmark 8 = ujung telunjuk (untuk mouse)
    # Landmark 4 = ujung jempol (untuk klik)
    # Jarak < 30 pixel = klik
```

## ✨ Keuntungan Integrasi Python

1. **Performa Lebih Baik**: MediaPipe Python lebih efisien
2. **Kontrol Penuh**: Semua logika hand gesture di Python
3. **Tidak Ada Konflik**: Tidak ada duplikasi library MediaPipe
4. **Real-time**: Hand gesture langsung terlihat di video feed
5. **PyAutoGUI**: Kontrol mouse sistem yang lebih powerful

## 🐛 Troubleshooting

### Hand Gesture Tidak Berfungsi:
- Pastikan kamera tidak digunakan aplikasi lain
- Cek console Python untuk error MediaPipe
- Pastikan PyAutoGUI tidak diblokir sistem

### Video Feed Tidak Muncul:
- Pastikan kamera terhubung
- Cek route `/video_feed` di browser
- Restart aplikasi Python

### Modal Tidak Hilang:
- Cek console browser untuk error JavaScript
- Pastikan button memiliki class yang benar
- Refresh halaman

## 📁 Struktur File

```
SiPhot/
├── App.py                    # Flask backend dengan hand gesture
├── templates/
│   └── photobooth.html      # Web interface
├── static/
│   ├── photobooth.js        # Frontend JavaScript
│   └── photobooth.css       # Styling
├── assets/                  # Frame images
└── uploads/                 # Output photos
```

## 🎯 File yang Dimodifikasi

- `templates/photobooth.html` - Video feed dan script
- `static/photobooth.js` - Hand gesture control
- `App.py` - Hand gesture integration
- `static/photobooth.css` - Camera status styling

## 🙏 Terima Kasih

- **MediaPipe** untuk hand tracking
- **Flask** untuk web framework
- **OpenCV** untuk computer vision
- **PyAutoGUI** untuk mouse control

**Dibuat dengan ❤️ untuk sambatawa.com**
