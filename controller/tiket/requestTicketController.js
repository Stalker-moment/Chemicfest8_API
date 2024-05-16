const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const QRCode = require("qr-image");
const JsBarcode = require("jsbarcode");
const { createCanvas } = require("canvas");

const maindatabase = "./db/maindata.json";
const ticketdatabase = "./db/ticket_storage.json";
const configdatabase = "./db/config.json";
const readconfig = JSON.parse(fs.readFileSync(configdatabase, "utf8"));

const { host_production, host_local } = readconfig.Server;
const qrdirectory = "./file/ticket/qrcode";
const barcodedirectory = "./file/ticket/barcode";

function gemerateBookingCode() {
  //generate booking code 12 digit
  return Math.floor(100000000000 + Math.random() * 900000000000);
}

function gemeratePassCode() {
  //generate pass code 6 digit
  return Math.floor(100000 + Math.random() * 900000);
}

async function getTicketQr(booking, pass, name) {
  try {
    // Data QR Code
    const data = {
      bookingCode: booking,
      passkey: pass,
    };

    // Opsi konfigurasi untuk QR Code
    const options = {
      type: "png", // Jenis file gambar yang dihasilkan (PNG)
      size: 1000, // Ukuran gambar (lebar dan tinggi)
      margin: 4, // Jarak antara QR Code dengan tepi gambar
      quality: 1, // Kualitas gambar (0-1, di mana 1 adalah kualitas tertinggi)
    };

    // Membuat QR Code
    const qrImage = QRCode.image(JSON.stringify(data), options);

    // Menyimpan gambar QR Code ke file
    qrImage.pipe(fs.createWriteStream(`${qrdirectory}/${name}.png`));
    return "success";
  } catch (error) {
    return "error";
  }
}

async function getTicketBarcode(booking, pass, name) {
  try {
    // Create canvas for barcode with larger dimensions
    const canvas = createCanvas(1000, 1000); // Ukuran canvas 1000x1000 piksel

    // Generate barcode on the canvas with increased scale
    JsBarcode(canvas, booking.toString() + pass.toString(), {
      format: "CODE128",
      displayValue: false,
      width: 4, // Lebar garis barcode
      height: 100, // Tinggi barcode
      //fontSize: 40 // Ukuran font teks (jika ada)
    });

    // Save barcode image as PNG
    const outPNG = fs.createWriteStream(`${barcodedirectory}/${name}.png`);
    const streamPNG = canvas.createPNGStream();
    streamPNG.pipe(outPNG);
    outPNG.on("finish", function () {
      console.log("Saved PNG");
      return "success";
    });
  } catch (error) {
    return "error";
  }
}

router.post("/request/ticket", async (req, res) => {
  const { users, venue, type, needed } = req.body;

  if (!users || !venue || !type) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (!needed && venue === "online") {
    res.status(400).json({ error: `Invalid request, online need "needed"` });
    return;
  }

  if (needed && venue !== "online") {
    res
      .status(400)
      .json({ error: `Invalid request, needed is only for online` });
    return;
  }

  if (needed && needed < 1) {
    res
      .status(400)
      .json({ error: `Invalid request, needed must be greater than 0` });
    return;
  }

  if (!venue === "online" || !venue === "offline") {
    res
      .status(400)
      .json({ error: `Invalid request, venue must be online/offline only` });
    return;
  }

  if (!type === "siswa" || !type === "alumni" || !type === "guru") {
    res
      .status(400)
      .json({ error: `Invalid request, type must be vip/regular only` });
    return;
  }

  if (users.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    var method = "email";
    var metode = "Email";
  } else if (users.match(/^[0-9]+$/) && users.length === 20) {
    //UUID 20 digit
    var method = "uuid";
    var metode = "UUID";
    users = parseInt(users);
  } else if (users.match(/^[0-9]+$/) && users.length > 9) {
    var method = "phone";
    var metode = "Phone";
  } else {
    var method = "username";
    var metode = "Username";
  }

  //check user
  const data = JSON.parse(fs.readFileSync(maindatabase, "utf8"));
  const user = data.users.find((user) => user[metode] === users);
  if (!user) {
    res.status(400).json({ error: `User not found` });
    return;
  }

  //create ticket qrcode
  const bookingCode = gemerateBookingCode();
  const passCode = gemeratePassCode();
  const qr = await getTicketQr(bookingCode, passCode, user.UUID);
  const barcode = await getTicketBarcode(bookingCode, passCode, user.UUID);

  if (qr === "error" || barcode === "error") {
    res.status(500).json({ code: 500, message: `Failed to create ticket` });
    var urlticket_qrcode = `${host_production}/file/ticket/qrcode/${user.UUID}.png`;
    var urlticket_barcode = `${host_production}/file/ticket/barcode/${user.UUID}.png`;
    return;
  } else if (qr === "success" && barcode === "success") {
    var urlticket_qrcode = `${host_production}/file/ticket/qrcode/${user.UUID}.png`;
    var urlticket_barcode = `${host_production}/file/ticket/barcode/${user.UUID}.png`;
  } else {
    res.status(500).json({ code: 500, message: `Failed to create ticket` });
    var urlticket_qrcode = `${host_production}/file/ticket/qrcode/${user.UUID}.png`;
    var urlticket_barcode = `${host_production}/file/ticket/barcode/${user.UUID}.png`;
    return;
  }

  //create ticket json
  const rawticket = {
    UUID: user.UUID,
    Name: user.Name,
    Email: user.Email,
    Phone: user.Phone,
    Ticket: {
      UrlTicket: {
        Qrcode: urlticket_qrcode,
        Barcode: urlticket_barcode,
      },
      BookingCode: bookingCode,
      PassCode: passCode,
      Venue: venue,
      Needed: needed,
      Type: type,
    },
    Created_At: new Date(),
  };

  //push needed if online at maindata (Max_Session) & push account at active
  user.Status = "Active";

  if (venue === "online") {
    user.Max_Session = needed;
  }
  fs.writeFileSync(maindatabase, JSON.stringify(data, null, 2));

  //store ticket
  const ticket = JSON.parse(fs.readFileSync(ticketdatabase, "utf8"));
  ticket.push(rawticket);
  fs.writeFileSync(ticketdatabase, JSON.stringify(ticket, null, 2));

  //send ticket
  res
    .status(200)
    .json({ code: 200, message: `Success to create ticket`, data: rawticket });
});

module.exports = router;
