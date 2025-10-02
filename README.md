# SiPhot - Photobooth dengan Hand Gesture Control
Aplikasi photobooth digital yang menggabungkan web interface modern dengan kontrol hand gesture untuk mouse.

# Web Photobooth
- Capture foto real-time dengan frame overlay
- Timer countdown yang dapat disesuaikan
- 4 pilihan frame yang berbeda
- Deteksi gerakan tangan untuk kontrol mouse
- Klik otomatis dengan gesture jempol dan telunjuk

# Aplikasi

1. **Start aplikasi**
   ```
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

### Web Photobooth Mode
1. **Pilih "1" untuk Web Photobooth Mode**
2. **Buka browser** dan akses: `http://localhost:5000`
3. **Berikan izin/tidak Hand Gesture** ketika diminta
4. **Pilih frame** yang diinginkan
5. **Atur timer** countdown (opsional)
6. **Klik "Ambil Foto"** untuk mengambil foto
7. **Pilih 4 foto terbaik** dari galeri
8. **Download** hasil gabungan foto
### Exit

## Cara Kerja Hand Gesture
1. Deteksi tangan dengan MediaPipe bentuk landmark tangan
2. Gerakan telunjuk untuk mengontrol posisi mouse
3. Gabungan jempol dan telunjuk (< 30px) untuk klik
## Terima Kasih
- MediaPipe untuk hand tracking
- Flask untuk web framework
- OpenCV untuk computer vision

**Dibuat dengan ❤️ untuk sambatawa.com**
