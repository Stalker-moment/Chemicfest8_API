const QRCode = require('qr-image');
const fs = require('fs');

// Data QR Code
const data = {
  bookingCode: '013063374911',
  passkey: '835740'
};

// Opsi konfigurasi untuk QR Code
const options = {
  type: 'png',  // Jenis file gambar yang dihasilkan (PNG)
  size: 1000,   // Ukuran gambar (lebar dan tinggi)
  margin: 4,    // Jarak antara QR Code dengan tepi gambar
  quality: 1    // Kualitas gambar (0-1, di mana 1 adalah kualitas tertinggi)
};

// Membuat QR Code
const qrImage = QRCode.image(JSON.stringify(data), options);

// Menyimpan gambar QR Code ke file
qrImage.pipe(fs.createWriteStream('qrcode.png'));


// // Generate SVG QR Code
// const qrCodeSVG = QRCode.imageSync(JSON.stringify(data), { type: 'svg' });
// // Save SVG as file
// fs.writeFileSync(`qrcode-${data.bookingCode}.svg`, qrCodeSVG);
// console.log(`QR Code saved as qrcode-${data.bookingCode}.svg`);

// Generate PNG QR Code
// const qrCodePNG = QRCode.imageSync(JSON.stringify(data), { type: 'png' });
// // Save PNG as file
// fs.writeFileSync(`qrcode-${data.bookingCode}.png`, qrCodePNG);
// console.log(`QR Code saved as qrcode-${data.bookingCode}.png`);
