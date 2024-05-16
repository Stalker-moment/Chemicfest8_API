const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const midtransClient = require("midtrans-client");
const chalk = require("chalk");

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

const maindatabase = "./db/maindata.json";
const ticketdatabase = "./db/ticket_storage.json";
const pricelistdatabase = "./db/pricelist.json";
const configdatabase = "./db/config.json";

const readconfig = JSON.parse(fs.readFileSync(configdatabase));

async function sendWAGRUPMessage(message) {
  const api_url = readconfig.WhatsappOTP.url_api;
  const API = api_url + "sendmessagegroup";
  const idgroup = readconfig.WhatsappOTP.group_id_2;

  const posting = await axios.post(API, {
    number: idgroup,
    message: message,
  });

  return posting.data.status;
}

const { isProduction } = readconfig.Midtrans;

//Midtrans configuration production
const productionmerchantid = readconfig.Midtrans.Production.MerchantID;
const productionckey = readconfig.Midtrans.Production.clientKey;
const productionskey = readconfig.Midtrans.Production.serverKey;

//Midtrans configuration sandbox
const sandboxmerchantid = readconfig.Midtrans.Sandbox.MerchantID;
const sandboxckey = readconfig.Midtrans.Sandbox.clientKey;
const sandboxskey = readconfig.Midtrans.Sandbox.serverKey;

// console.log("sandboxckey: ", sandboxckey);
// console.log("sandboxskey: ", sandboxskey);

//Midtrans configuration environment
if (isProduction) {
  var core = new midtransClient.Snap({
    isProduction: true,
    serverKey: productionskey,
    clientKey: productionckey,
  });
} else {
  var core = new midtransClient.Snap({
    isProduction: false,
    serverKey: sandboxskey,
    clientKey: sandboxckey,
  });
}
router.post("/buyticket", async (req, res) => {
  const { ticketid, uuid, type } = req.body;

  if (!ticketid || !uuid || !type) {
    res.status(400).send("Invalid request");
    return;
  }

  if (type !== "online" && type !== "offline") {
    res.status(400).send("Invalid type");
    return;
  }

  const maindata = JSON.parse(fs.readFileSync(maindatabase));
  const ticketdata = JSON.parse(fs.readFileSync(ticketdatabase));
  const pricelist = JSON.parse(fs.readFileSync(pricelistdatabase));
  const config = JSON.parse(fs.readFileSync(configdatabase));

  //check uuid validity
  const user = maindata.find((user) => user.UUID === uuid);
  if (!user) {
    res.status(400).send("Invalid UUID");
    return;
  }

  if (type === "online") {
    //check ticket validity
    const ticketonline = pricelist.TicketOnline.find(
      (ticket) => ticket.ProductId === ticketid
    );

    if (!ticketonline) {
      res.status(400).send("Invalid ticket ID");
      return;
    }

    const ids_trans =
      ticketonline.ProductId.toString() +
      "_" +
      uuid.toString() +
      "_" +
      Date.now().toString();

    const transaction_details = {
      order_id: ids_trans,
      gross_amount: ticketonline.Price,
    };

    //don't use credit card, just QRIS
    const credit_card = {
      secure: true,
    };

    const customer_details = {
      first_name: user.Name,
      email: user.Email,
      phone: user.Phone,
    };

    const item_details = [
      {
        ProductId: ticketonline.ProductId,
        price: ticketonline.Price,
        quantity: 1,
        name: ticketonline.Name,
      },
    ];

    // console.log(transaction_details)
    // console.log(customer_details)
    // console.log(item_details)

    const parameter = {
      transaction_details,
      credit_card,
      customer_details,
      item_details,
    };

    // core
    //   .charge(parameter)
    //   .then((chargeResponse) => {
    //     res.status(200).json(chargeResponse);
    //   })
    //   .catch((err) => {
    //     res.status(400).json(err);
    //   });
    //write transaction to ticket data

    //search user in ticket data
    const ticketuserfind = ticketdata.find((users) => users.UUID === user.UUID);
    if (ticketuserfind) {
      ticketuserfind.Transaction.push({
        Payment: {
          OrderID: ids_trans,
          Method: "QRIS",
          Status: "on pending",
          Amount: ticketonline.Price,
          Unit: "IDR",
          Time: new Date().toISOString(),
        },
        Ticket: {
          ProductId: ticketonline.ProductId,
          UrlTicket: {
            Qrcode: "https://chemicfest.site/file/ticket/qrcode/0",
            Barcode: "https://chemicfest.site/file/ticket/barcode/0",
            Eticket: "https://chemicfest.site/eticket/0",
            Download_Eticket: "https://chemicfest.site/dl/eticket/0",
            Invoice: "https://chemicfest.site/invoice/ticket/0",
            Download_Invoice: "https://chemicfest.site/dl/invoice/ticket/0",
          },
          BookingCode: "",
          PassCode: "",
          TicketCode: "",
          Venue: type,
          Needed: 1,
          Type: user.Role,
        },
      });
      fs.writeFileSync(ticketdatabase, JSON.stringify(ticketdata, null, 2));
    } else {
      //if user not found, create new user
      const newuser = {
        UUID: uuid,
        Name: user.Name,
        Username: user.Username,
        Email: user.Email,
        Phone: user.Phone,
        Transaction: [
          {
            Payment: {
              OrderID: ids_trans,
              Method: "QRIS",
              Status: "on pending",
              Amount: ticketonline.Price,
              Unit: "IDR",
              Time: new Date().toISOString(),
            },
            Ticket: {
              ProductId: ticketonline.ProductId,
              UrlTicket: {
                Qrcode: "https://chemicfest.site/file/ticket/qrcode/0",
                Barcode: "https://chemicfest.site/file/ticket/barcode/0",
                Eticket: "https://chemicfest.site/eticket/0",
                Download_Eticket: "https://chemicfest.site/dl/eticket/0",
                Invoice: "https://chemicfest.site/invoice/ticket/0",
                Download_Invoice: "https://chemicfest.site/dl/invoice/ticket/0",
              },
              BookingCode: "",
              PassCode: "",
              TicketCode: "",
              Venue: type,
              Needed: 1,
              Type: user.Role,
            },
          },
        ],
      };
      ticketdata.push(newuser);
      fs.writeFileSync(ticketdatabase, JSON.stringify(ticketdata, null, 2));
    }

    // var token = await core.createTransactionToken(parameter);
    var token = await core.createTransactionToken(parameter);
    //check token response
    if (!token) {
      res.status(400).json({
        code: 400,
        error: "An error occurred while processing your request",
      });
      return;
    }

    //send message to whatsapp group
    const message = `
*New Ticket Order*

*Name:* ${user.Name}
*Email:* ${user.Email}
*Phone:* ${user.Phone}
*Ticket:* ${ticketonline.Name}
*Price:* ${ticketonline.Price}
*OrderID:* ${
  ticketonline.ProductId.toString() +
  "_" +
  uuid.toString() +
  "_" +
  Date.now().toString()
}

*Time:* ${new Date().toISOString()}
*Status:* on pending
*Method:* QRIS
*Unit:* IDR
`;
    sendWAGRUPMessage(message);

    console.log(
      chalk.cyan(dateformat()), 
      chalk.bgGreen(`[Buy Ticket]`),
      chalk.blue(`${user.Email}`),
      chalk.white(`Buy Ticket, Type:`),
      chalk.bgCyan(type),
      chalk.white("Price:"),
      chalk.bgCyan(ticketonline.Price),
      chalk.inverse(`TOKEN: ${token}`),
      chalk.white(`.`)
    );
    //return 'Your Token :' + token;
    return res.json(token);
  } else {
    //check ticket validity
    const ticketoffline = pricelist.TicketOffline.find(
      (ticket) => ticket.ProductId === ticketid
    );
    if (!ticketoffline) {
      res.status(400).send("Invalid ticket ID");
      return;
    }

    const ids_trans =
      ticketoffline.ProductId.toString() +
      "_" +
      uuid.toString() +
      "_" +
      Date.now().toString();

    const transaction_details = {
      order_id: ids_trans,
      gross_amount: ticketoffline.Price,
    };

    const credit_card = {
      secure: true,
    };

    const customer_details = {
      first_name: user.Name,
      email: user.Email,
      phone: user.Phone,
    };

    const item_details = [
      {
        id: ticketoffline.ProductId,
        price: ticketoffline.Price,
        quantity: 1,
        name: ticketoffline.Name,
      },
    ];

    const parameter = {
      item_details,
      transaction_details,
      credit_card,
      customer_details,
    };

    // core
    //   .charge(parameter)
    //   .then((chargeResponse) => {
    //     res.status(200).json(chargeResponse);
    //   })
    //   .catch((err) => {
    //     console.error(err); // Log the error for debugging purposes
    //     res.status(400).json({ error: 'An error occurred while processing your request' });
    //   });

    //search user in ticket data
    const ticketuserfind = ticketdata.find((users) => users.UUID === user.UUID);
    if (ticketuserfind) {
      ticketuserfind.Transaction.push({
        Payment: {
          OrderID: ids_trans,
          Method: "QRIS",
          Status: "on pending",
          Amount: ticketoffline.Price,
          Unit: "IDR",
          Time: new Date().toISOString(),
        },
        Ticket: {
          ProductId: ticketoffline.ProductId,
          UrlTicket: {
            Qrcode: "https://chemicfest.site/file/ticket/qrcode/0",
            Barcode: "https://chemicfest.site/file/ticket/barcode/0",
            Eticket: "https://chemicfest.site/eticket/0",
            Download_Eticket: "https://chemicfest.site/dl/eticket/0",
            Invoice: "https://chemicfest.site/invoice/ticket/0",
            Download_Invoice: "https://chemicfest.site/dl/invoice/ticket/0",
          },

          BookingCode: "",
          PassCode: "",
          TicketCode: "",
          Venue: type,
          Needed: 1,
          Type: user.Role,
        },
      });
      fs.writeFileSync(ticketdatabase, JSON.stringify(ticketdata, null, 2));
    } else {
      //if user not found, create new user
      const newuser = {
        UUID: uuid,
        Name: user.Name,
        Username: user.Username,
        Email: user.Email,
        Phone: user.Phone,
        Transaction: [
          {
            Payment: {
              OrderID: ids_trans,
              Method: "QRIS",
              Status: "on pending",
              Amount: ticketoffline.Price,
              Unit: "IDR",
              Time: new Date().toISOString(),
            },
            Ticket: {
              ProductId: ticketoffline.ProductId,
              UrlTicket: {
                Qrcode: "https://chemicfest.site/file/ticket/qrcode/0",
                Barcode: "https://chemicfest.site/file/ticket/barcode/0",
                Eticket: "https://chemicfest.site/eticket/0",
                Download_Eticket: "https://chemicfest.site/dl/eticket/0",
                Invoice: "https://chemicfest.site/invoice/ticket/0",
                Download_Invoice: "https://chemicfest.site/dl/invoice/ticket/0",
              },
              BookingCode: "",
              PassCode: "",
              TicketCode: "",
              Venue: type,
              Needed: 1,
              Type: user.Role,
            },
          },
        ],
      };
      ticketdata.push(newuser);
      fs.writeFileSync(ticketdatabase, JSON.stringify(ticketdata, null, 2));
    }

    var token = await core.createTransactionToken(parameter);
    //check token response
    if (!token) {
      res.status(400).json({
        code: 400,
        error: "An error occurred while processing your request",
      });
      return;
    }

    //send message to whatsapp group
    const message = `
*New Ticket Order*

*Name:* ${user.Name}
*Email:* ${user.Email}
*Phone:* ${user.Phone}
*Ticket:* ${ticketoffline.Name}
*Price:* ${ticketoffline.Price}
*OrderID:* ${
  ticketoffline.ProductId.toString() +
  "_" +
  uuid.toString() +
  "_" +
  Date.now().toString()
}

*Time:* ${new Date().toISOString()}
*Status:* on pending
*Method:* QRIS
*Unit:* IDR
`;
    sendWAGRUPMessage(message);

    console.log(
      chalk.cyan(dateformat()), 
      chalk.bgGreen(`[Buy Ticket]`),
      chalk.blue(`${user.Email}`),
      chalk.white(`Buy Ticket, Type:`),
      chalk.bgCyan(type),
      chalk.white("Price:"),
      chalk.bgCyan(ticketoffline.Price),
      chalk.inverse(`TOKEN: ${token}`),
      chalk.white(`.`)
    );
    //return 'Your Token :' + token;
    return res.json(token);
  }
});

module.exports = router;
