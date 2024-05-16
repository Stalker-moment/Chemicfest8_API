const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const midtransClient = require("midtrans-client");
const chalk = require("chalk");
const nodemailer = require("nodemailer");

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

const ticketdatabase = "./db/ticket_storage.json";
const maindatabase = "./db/maindata.json";
const config = "./db/config.json";
const generateQRCodeTicket = require("../../function/generateQRCodeTicket");
const generateBarcodeTicket = require("../../function/generateBarcodeTicket");

const readconfig = JSON.parse(fs.readFileSync(config));

async function generateRandomIntegers(number) {
  let result = "";
  const characters = "1234567890";
  const charactersLength = characters.length;
  for (let i = 0; i < number; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function sendWAGRUPMessage(message) {
  const api_url = readconfig.WhatsappOTP.url_api;
  const API = api_url + "sendmessagegroup";
  const idgroup = readconfig.WhatsappOTP.group_id;

  const posting = await axios.post(API, {
    number: idgroup,
    message: message,
  });

  return posting.data.status;
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
      console.log(chalk.cyan(dateformat()), "Email Error: ", error);
      return error;
    } else {
      console.log(chalk.cyan(dateformat()), "Email sent: " + info.response + " to " + email + "Action : Verify Payment Ticket");
      return info.response;
    }
  });
}

router.post("/verify/payment/ticket", async (req, res) => {
  const { users, order_id, transaction_status, payment_method } = req.body;

  const ticketdbdata = JSON.parse(fs.readFileSync(ticketdatabase, "utf-8"));
  const userdata = JSON.parse(fs.readFileSync(maindatabase, "utf-8"));

  if (!users || !order_id || !transaction_status || !payment_method) {
    return res.status(400).json({
      status: "failed",
      message:
        "Please provide users, order_id, transaction_status, and payment_method",
    });
  }

  //detect method

  //console.log(method, userss, users.toString().length);

  const ticketuserfind = ticketdbdata.find((ticket) => ticket.UUID === users);
  const userfind = userdata.find((user) => user.UUID === users);
  //console.log(ticketuserfind);

  if (ticketuserfind) {
    const ticketiduserfind = ticketuserfind.Transaction.find(
      (ticket) => ticket.Payment.OrderID === order_id
    );

    if (ticketiduserfind) {
      if (ticketiduserfind.Payment.Status === "on success") {
        return res.status(200).json({
          status: "success",
          message: "Payment has been verified before this request",
        });
      }

      if (transaction_status.toLowerCase() === "on pending") {
        ticketiduserfind.Payment.Status = "on pending";
        ticketiduserfind.Payment.Method = payment_method;
        fs.writeFileSync(ticketdatabase, JSON.stringify(ticketdbdata, null, 2));
        res.status(200).json({
          status: "pending",
          message: "Payment has been pending",
        });
      } else if (transaction_status.toLowerCase() === "on error") {
        ticketiduserfind.Payment.Status = "on error";
        ticketiduserfind.Payment.Method = payment_method;
        fs.writeFileSync(ticketdatabase, JSON.stringify(ticketdbdata, null, 2));
        res.status(200).json({
          status: "error",
          message: "Payment has been error",
        });
      } else if (transaction_status.toLowerCase() === "on success") {
        //check if payment already verified

        ticketiduserfind.Payment.Status = "on success";

        //generate ticket code
        const ticketcode = await generateRandomIntegers(6);
        const passcode = await generateRandomIntegers(4);

        ticketiduserfind.Ticket.BookingCode = ticketcode;
        ticketiduserfind.Ticket.PassCode = passcode;
        ticketiduserfind.Ticket.Method = payment_method;
        ticketiduserfind.Ticket.TicketCode = `${ticketuserfind.UUID}${ticketcode}${passcode}`;
        if (ticketiduserfind.Ticket.Venue === "offline") {
          ticketiduserfind.Ticket.UrlTicket.Qrcode = `https://chemicfest.site/file/ticket/qrcode/${ticketuserfind.UUID}${ticketcode}${passcode}.png`;
          ticketiduserfind.Ticket.UrlTicket.Barcode = `https://chemicfest.site/file/ticket/barcode/${ticketuserfind.UUID}${ticketcode}${passcode}.png`;
          generateBarcodeTicket(
            ticketuserfind.UUID,
            ticketiduserfind.Ticket.BookingCode,
            ticketiduserfind.Ticket.PassCode
          );
          generateQRCodeTicket(
            ticketuserfind.UUID,
            ticketiduserfind.Ticket.BookingCode,
            ticketiduserfind.Ticket.PassCode
          );
        } else {
          ticketiduserfind.Ticket.UrlTicket.Qrcode = `https://chemicfest.site/file/ticket/qrcode/online.png`;
          ticketiduserfind.Ticket.UrlTicket.Barcode = `https://chemicfest.site/file/ticket/barcode/online.png`;
          userfind.Status = "Active";
          userfind.Max_Session = 1;
          fs.writeFileSync(maindatabase, JSON.stringify(userdata, null, 2));
        }
        ticketiduserfind.Ticket.UrlTicket.Eticket = `https://chemicfest.site/eticket/${ticketuserfind.UUID}${ticketcode}${passcode}`;
        ticketiduserfind.Ticket.UrlTicket.Download_Eticket = `https://chemicfest.site/dl/eticket/${ticketuserfind.UUID}${ticketcode}${passcode}`;
        ticketiduserfind.Ticket.UrlTicket.Invoice = `https://chemicfest.site/invoice/ticket/${ticketuserfind.UUID}${ticketcode}${passcode}`;
        ticketiduserfind.Ticket.UrlTicket.Download_Invoice = `https://chemicfest.site/dl/invoice/ticket/${ticketuserfind.UUID}${ticketcode}${passcode}`;

        fs.writeFileSync(ticketdatabase, JSON.stringify(ticketdbdata, null, 2));

        //pre send email
        const typeuser = userfind.Role.toUpperCase();
        const typeticket = ticketiduserfind.Ticket.ProductId.toString();

        const unixuser = userfind.Phone.toString().slice(-4);
        const unix2user = userfind.UUID.toString().slice(0, 4);

        const unixinvoice = unixuser + unix2user;

        //parse timestamp ISO to format : 17 Mei 2024
        const date = new Date(ticketiduserfind.Payment.Time);
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDate = date.toLocaleDateString("id-ID", options);

        //format amount to currency IDR
        const amount = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(ticketiduserfind.Payment.Amount);

        //send email
        sendEmail(
          userfind.Email,
          userfind.Name,
          amount,
          payment_method,
          typeticket,
          unixuser,
          unix2user,
          unixinvoice,
          formattedDate,
          typeuser,
          ticketiduserfind.Ticket.UrlTicket.Eticket,
          ticketiduserfind.Ticket.UrlTicket.Invoice
        );

        const message = `
🎉 *Pembayaran Berhasil* 🎉

User *${userfind.Name}* telah melakukan pembayaran tiket Chemicfest#8.
Role: *${typeuser}*

🎫 *Tiket*: ${typeticket}
📆 *Tanggal*: ${formattedDate}
💰 *Total*: ${amount}
🔒 *Metode*: ${payment_method}
🔖 *Invoice*: CF8-${typeticket}-${unixinvoice}
`;
        sendWAGRUPMessage(message);

        res.status(200).json({
          status: "success",
          message: "Payment has been verified",
        });
      } else {
        res.status(200).json({
          status: "failed",
          message: "Transaction status not found",
        });
      }
    } else {
      res.status(404).json({
        status: "failed",
        message: "Order ID not found",
      });
    }
  } else {
    res.status(404).json({
      status: "failed",
      message: "User not found",
    });
  }
});

module.exports = router;
