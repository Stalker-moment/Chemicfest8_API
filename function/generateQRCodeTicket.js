const QRCode = require("qr-image");
const chalk = require("chalk");
const fs = require("fs");

//define date with format hours:minutes:seconds dd/mm/yyyy
function dateformat() {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `[${hours}:${minutes}:${seconds} ${day}/${month}/${year}]`;
}

const dirTicketQrCode = './file/ticket/qrcode/';

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
  console.log(chalk.cyan(dateformat()), chalk.green("QRCode ticket " + IDTicket + " has been generated!"));
}

module.exports = generateQRCodeTicket;
