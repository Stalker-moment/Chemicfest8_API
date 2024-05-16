const QRCode = require("qr-image");
const chalk = require("chalk");
const fs = require("fs");

const dirTicketQrCode = '../file/ticket/qrcode/';
async function generateQRCodeTicket(UUID, TicketId, TicketPass) {
  const IDTicket = UUID.toString() + TicketId.toString() + TicketPass.toString();
  // Data QR Code
  const data = IDTicket;

  // Opsi konfigurasi untuk QR Code
  const options = {
    type: "png", // Jenis file gambar yang dihasilkan (PNG)
    size: 256, // Ukuran gambar (lebar dan tinggi)
    margin: 4, // Jarak antara QR Code dengan tepi gambar
    quality: 0, // Kualitas gambar (0-1, di mana 1 adalah kualitas tertinggi)
  };

  // Membuat QR Code
  const qrImage = QRCode.image(JSON.stringify(data), options);

  // Menyimpan gambar QR Code ke file
  qrImage.pipe(fs.createWriteStream(dirTicketQrCode + IDTicket + ".png"));
  console.log(chalk.green("QRCode ticket " + IDTicket + " has been generated!"));
}

generateQRCodeTicket("72467926099311680000", "4520", "565108");
