const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const downloadLink = document.getElementById('download');
const ctx = canvas.getContext('2d');

// Aktifkan kamera
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  });

// Ambil foto saat tombol ditekan
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Gambar video ke canvas
  ctx.drawImage(video, 0, 0);

  // Tambahkan filter (bisa dimodifikasi untuk posisi/rotasi)
  const filterImg = document.getElementById('filter');
  ctx.drawImage(filterImg, 200, 100, 200, 100); // topi

  // Buat link untuk download
  const dataUrl = canvas.toDataURL('image/png');
  downloadLink.href = dataUrl;
});
