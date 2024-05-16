const JsBarcode = require("jsbarcode");
const { createCanvas } = require("canvas");
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

const dirTicketBarcode = './file/ticket/barcode/';

async function generateBarcodeTicket(UUID, TicketId, TicketPass) {
  const canvas = createCanvas(1000, 1000);
  const IDTicket = UUID.toString() + TicketId.toString() + TicketPass.toString();
  JsBarcode(canvas, IDTicket, {
    format: "CODE128",
    displayValue: true,
    width: 4, // Lebar garis barcode
    height: 100, // Tinggi barcode
    //fontSize: 40 // Ukuran font teks (jika ada)
  });

  // Save barcode image as PNG
  const outPNG = fs.createWriteStream(dirTicketBarcode + IDTicket + ".png");
  const streamPNG = canvas.createPNGStream();
  streamPNG.pipe(outPNG);
  outPNG.on("finish", function () {
    console.log(chalk.cyan(dateformat()), chalk.green("Barcode ticket " + IDTicket + " has been generated!"));
  });
}

module.exports = generateBarcodeTicket;
