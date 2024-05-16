const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const chalk = require("chalk");
const { telepen } = require("bwip-js");
const emailExistence = require("email-existence");
const nodemailer = require("nodemailer");
const { Session } = require("inspector");

//LOAD DATABASE
const maindatadb = "./db/maindata.json";
const otpdatadb = "./db/otp_storage.json";
const ticketdatadb = "./db/ticket_storage.json";
const config = "./db/config.json";
const generateQRCodeTicket = require("./function/generateQRCodeTicket");
const generateBarcodeTicket = require("./function/generateBarcodeTicket");
const { send } = require("process");

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

function twentyrandomintegers() {
  let result = "";
  const characters = "1234567890";
  const charactersLength = characters.length;
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  //check if front number is 0
  if (result.startsWith("0")) {
    result = result.replace("0", "1");
  }

  return result;
}

async function generateRandomIntegers(number) {
  let result = "";
  const characters = "1234567890";
  const charactersLength = characters.length;
  for (let i = 0; i < number; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function Wa_Validator(nomornya) {
  try {
    const get_data = await axios.get(
      `https://wapi.tierkun.my.id/api/v1/checknumber/${nomornya}`
    );

    if (!get_data.data.result) {
      return "error";
    }

    if (get_data.data.result === "true") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`[WA VALIDATOR]`), chalk.white(`Error: ${error}`));
    return "error";
  }
}

// Fungsi untuk memeriksa keberadaan email
function checkEmailExistence(email) {
  return new Promise((resolve, reject) => {
    emailExistence.check(email, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

async function sendWAGRUPMessage(message) {
  const readconfig = JSON.parse(fs.readFileSync(config));
  const api_url = readconfig.WhatsappOTP.url_api;
  const API = api_url + "sendmessagegroup";
  const idgroup = readconfig.WhatsappOTP.group_id_2;

  const posting = await axios.post(API, {
    number: idgroup,
    message: message,
  });

  return posting.data.status;
}

async function sendWhatsapp(phone, msg) {
  const gethost = JSON.parse(fs.readFileSync(config));
  const { url_api } = gethost.WhatsappOTP;

  const urisend = url_api + "sendmessage";
  const params = {
    number: phone,
    message: msg,
  };
  axios
    .post(urisend, params)
    .then(function (response) {
      console.log(chalk.cyan(dateformat()), response.data);
      return response.data;
    })
    .catch(function (error) {
      console.log(chalk.cyan(dateformat()), error);
      return error;
    });
}

function sendEmail(
  email,
  name,
  amount,
  method,
  typeticket,
  unixuser,
  unix2user,
  unixinvoice,
  formattedDate,
  typeuser,
  urlticket,
  urlinvoice
) {
  const gethost = JSON.parse(fs.readFileSync(config));
  const { isProduction } = gethost.EmailOTP;
  const { service, user, pass } = isProduction
    ? gethost.EmailOTP.ProductionEmail
    : gethost.EmailOTP.LocalEmail;

  const { port, secure } = gethost.EmailOTP.ProductionEmail;
  if (isProduction) {
    var transporter = nodemailer.createTransport({
      host: service,
      port: port,
      secure: secure, // true for port 465, false for other ports
      auth: {
        user: user,
        pass: pass,
      },
    });
  } else {
    var transporter = nodemailer.createTransport({
      service: service,
      auth: {
        user: user,
        pass: pass,
      },
    });
  }

  var mailOptions = {
    from: user,
    to: email,
    subject: "Chemicfest#8 - Ticket Invoice",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice Chemicfest#8</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f1f1f1;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td align="center">
              <h1 style="font-size: 24px; font-weight: bold; margin: 20px 0;">Terimakasih atas pembelian anda!</h1>
            </td>
          </tr>
          <tr>
            <td>
              <!-- Header -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="10%">
                    <img src="https://chemicfest.site/file/assets/osis.png" alt="OSIS Logo" style="width: 100%;">
                  </td>
                  <td width="50%" align="right">
                    <h2 style="font-size: 20px; font-weight: bold;">INVOICE</h2>
                    <h3 style="font-size: 16px; color: #FC664E; margin: 0;">INV/${unixuser}/${unix2user}/<span style="white-space: nowrap;">TKT/${typeticket}</span></h3>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <!-- Content -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="50%">
                    <h2 style="font-size: 18px; font-weight: bold;">DITERBITKAN OLEH</h2>
                    <p style="font-size: 14px; font-weight: bold;">Chemicfest#8 | OSIS Chemicalistronic</p>
                    <p style="font-size: 14px;">Jl. Kusumanegara No.3, Yogyakarta 55166</p>
                    <p style="font-size: 14px;">noreply@chemicfest.com</p>
                  </td>
                  <td width="50%">
                    <h2 style="font-size: 18px; font-weight: bold;">UNTUK</h2>
                    <p style="font-size: 14px; font-weight: bold;">Kode Pesanan: CF8-${typeticket}-${unixinvoice}</p>
                    <p style="font-size: 14px; font-weight: bold;">Nama Pemesan: ${name}</p>
                    <p style="font-size: 14px; font-weight: bold;">Tanggal Pembelian: ${formattedDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <!-- Table -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px;">
                <tr>
                  <th style="font-size: 14px; font-weight: bold; padding: 5px;">PRODUK</th>
                  <th style="font-size: 14px; font-weight: bold; padding: 5px;">JUMLAH</th>
                  <th style="font-size: 14px; font-weight: bold; padding: 5px;">HARGA SATUAN</th>
                  <th style="font-size: 14px; font-weight: bold; padding: 5px;">TOTAL HARGA</th>
                </tr>
                <tr>
                  <td style="font-size: 14px; padding: 5px;">Ticket Chemicfest#8 ${typeuser}</td>
                  <td style="font-size: 14px; padding: 5px;">1</td>
                  <td style="font-size: 14px; padding: 5px;">${amount}</td>
                  <td style="font-size: 14px; padding: 5px; color: #FC664E; font-weight: bold;">${amount}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <!-- Footer -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px;">
                <tr>
                  <td style="background-color: #F2F2E8; padding: 16px; border-radius: 20px 20px 0 0;">
                    <table cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <h2 style="font-size: 16px; font-weight: bold;">TOTAL</h2>
                          <h2 style="font-size: 24px; font-weight: bold; color: #FC664E;">${amount}</h2>
                        </td>
                        <td>
                          <h2 style="font-size: 16px; font-weight: bold;">METODE PEMBAYARAN</h2>
                          <h2 style="font-size: 24px; font-weight: bold;">${method}</h2>
                        </td>
                        <td>
                          <h2 style="font-size: 16px; font-weight: bold;">STATUS</h2>
                          <h2 style="font-size: 24px; font-weight: bold;">LUNAS</h2>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="margin-top: 20px;">
                    <a href="${urlticket}" style="background-color: #FFD700; color: white; font-weight: bold; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Lihat E-Ticket</a>
                    <a href="${urlinvoice}" style="background-color: #FFA500; color: white; font-weight: bold; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">Download Invoice</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>    
          `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Email Error: ", error);
      return error;
    } else {
      console.log("Email sent: " + info.response);
      return info.response;
    }
  });
}

async function addNewUserTicketing(
  name,
  username,
  kelas,
  role,
  NIS,
  email,
  nomor,
  payment,
  address
) {
  const getUUID = parseInt(twentyrandomintegers());
  const dateNowString = new Date().toISOString();
  const dateNowInteger = new Date().getTime();
  const ticketcode = await generateRandomIntegers(6);
  const passcode = await generateRandomIntegers(4);

  //reading database
  const maindata = fs.readFileSync(maindatadb);
  const otpdata = fs.readFileSync(otpdatadb);
  const ticketdata = fs.readFileSync(ticketdatadb);

  const checkNumber = await Wa_Validator(nomor);
  if (checkNumber === true) {
    var NumberValidate = true;
  } else if (checkNumber === false) {
    var NumberValidate = false;
  } else {
    var NumberValidate = false;
  }

  const emailcheck = await checkEmailExistence(email);

  if (emailcheck === false) {
    var EmailValidate = false;
  } else {
    var EmailValidate = true;
  }

  const MainDataRaw = {
    UUID: getUUID,
    Status: "Deactive",
    Verified: {
      Method: "OTP",
      Email: EmailValidate,
      Phone: NumberValidate,
    },
    Attachment: {
      Type_Image_1: "-",
      Inmage_1: "-",
      Type_Image_2: "-",
      Image_2: "-",
    },
    PartOf: {
      Role: "-",
      Kelas: "-",
      Name: "-",
      ID: "-",
    },
    Created_At: dateNowString,
    Name: name,
    Details: {
      ID: NIS,
      TypeID: "NIS",
      Kelas: kelas,
      Gender: "-",
      Address: address,
    },
    Username: username,
    Password: NIS,
    Email: email,
    Phone: nomor,
    Role: role,
    Picture: "https://chemicfest.site/file/profile/default.jpg",
    Max_Session: 1,
    Now_Session: 0,
    Max_Main_Session: 1,
    Now_Main_Session: 0,
    Main_Session: [],
    Expired_Main_Session: [],
    Session: [],
    Expired_Session: [],
  };

  const OtpDataRaw = {
    UUID: getUUID,
    Name: name,
    Email: email,
    Phone: nomor,
    Verified: {
      Email: EmailValidate,
      Phone: NumberValidate,
    },
    Otp: [],
    CreatedAt: dateNowString,
  };

  const TicketDataRaw = {
    UUID: getUUID,
    Name: name,
    Username: username,
    Email: email,
    Phone: nomor,
    Transaction: [
      {
        Payment: {
          OrderID: `101_${getUUID}_${dateNowInteger}`,
          Method: payment,
          Status: "on success",
          Amount: 40000,
          Unit: "IDR",
          Time: dateNowString,
        },
        Ticket: {
          ProductId: 101,
          UrlTicket: {
            Barcode: `https://chemicfest.site/file/ticket/barcode/${getUUID}${ticketcode}${passcode}.png`,
            Qrcode: `https://chemicfest.site/file/ticket/qrcode/${getUUID}${ticketcode}${passcode}.png`,
            Eticket: `https://chemicfest.site/eticket/${getUUID}${ticketcode}${passcode}`,
            Download_Eticket: `https://chemicfest.site/dl/eticket/${getUUID}${ticketcode}${passcode}`,
            Invoice: `https://chemicfest.site/invoice/ticket/${getUUID}${ticketcode}${passcode}`,
            Download_Invoice: `https://chemicfest.site/dl/invoice/ticket/${getUUID}${ticketcode}${passcode}`,
          },
          BookingCode: ticketcode,
          PassCode: passcode,
          TicketCode: `${getUUID}${ticketcode}${passcode}`,
          Venue: "Offline",
          Needed: 1,
          Type: "siswa",
        },
      },
    ],
  };

  //parsing data
  let MainData = JSON.parse(maindata);
  let OtpData = JSON.parse(otpdata);
  let TicketData = JSON.parse(ticketdata);

  //push data
  MainData.push(MainDataRaw);
  OtpData.push(OtpDataRaw);
  TicketData.push(TicketDataRaw);

  //write data
  fs.writeFileSync(maindatadb, JSON.stringify(MainData, null, 2));
  fs.writeFileSync(otpdatadb, JSON.stringify(OtpData, null, 2));
  fs.writeFileSync(ticketdatadb, JSON.stringify(TicketData, null, 2));

  //generate barcode
  await generateBarcodeTicket(getUUID, ticketcode, passcode);
  await generateQRCodeTicket(getUUID, ticketcode, passcode);

  //pre send email
  const typeuser = role.toUpperCase();
  const typeticket = "101";

  const unixuser = nomor.toString().slice(-4);
  const unix2user = getUUID.toString().slice(0, 4);

  const unixinvoice = unixuser + unix2user;

  //parse timestamp ISO to format : 17 Mei 2024
  const date = new Date(dateNowString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = date.toLocaleDateString("id-ID", options);

  //format amount to currency IDR
  const amount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(40000);

  //send email
  sendEmail(
    email,
    name,
    amount,
    payment,
    typeticket,
    unixuser,
    unix2user,
    unixinvoice,
    formattedDate,
    typeuser,
    `https://chemicfest.site/eticket/${getUUID}${ticketcode}${passcode}`,
    `https://chemicfest.site/invoice/ticket/${getUUID}${ticketcode}${passcode}`
  );

  //send whatsapp
  await sendWhatsapp(nomor, `Halo, ${name}! 
Tiket Chemicfest#8 kamu sudah berhasil dibuat! 
Kamu bisa melihat E-Ticket kamu di https://chemicfest.site/eticket/${getUUID}${ticketcode}${passcode} 
dan download Invoice kamu di https://chemicfest.site/invoice/ticket/${getUUID}${ticketcode}${passcode} 

Login ke akun kamu di https://chemicfest.site/login untuk melihat detail tiket kamu.
User & Pass: ${NIS}

Jangan lupa untuk menunjukkan E-Ticket saat hari H ya!

Terimakasih!`)  

  console.log(
    chalk.green(`[TICKET]`),
    chalk.white(
      `New Ticketing User Added`,
      chalk.green(`[UUID: ${getUUID}]`),
      chalk.green(`[Username: ${username}]`),
      chalk.green(`[Name: ${name}]`),
      chalk.green(`[Email: ${email}]`),
      chalk.green(`[Phone: ${nomor}]`),
      chalk.green(`[Payment: ${payment}]`),
      chalk.green(`[Address: ${address}]`)
    )
  );
}

const userinput = "./input.json";

const inputdata = fs.readFileSync(userinput);
const input = JSON.parse(inputdata);

async function processUserData(index) {
  try {
    if (index < input.length) {
      const { NIS, Name, Email, Phone, Kelas } = input[index];
      await addNewUserTicketing(
        Name,
        NIS.toString(),
        Kelas,
        "siswa",
        NIS,
        Email,
        Phone,
        "Tunai",
        ""
      );
      await sendWAGRUPMessage(
        `🎟 *Tiket Baru!* 🎟\n\nNama: ${Name}\nKelas: ${Kelas}\nNIS: ${NIS}\nEmail: ${Email}\nPhone: ${Phone}`
      );
      await processUserData(index + 1); // Memanggil fungsi rekursif untuk data berikutnya
    }
  } catch (error) {
    console.log(chalk.red(`[ERROR]`), chalk.white(`Error: ${error}`));
  }
}

processUserData(0); // Mulai pemrosesan dari indeks 0
