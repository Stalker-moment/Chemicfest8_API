const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const chalk = require("chalk");

const ticketdatabase = "./db/ticket_storage.json";
const userdatabase = "./db/maindata.json";

router.post("/check/have/ticket", (req, res) => {
  const users = req.body.users;

  const ticketData = JSON.parse(fs.readFileSync(ticketdatabase, "utf-8"));

  //detect method
  // if (
  //   users.toString().match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
  // ) {
  //   var method = "Email";
  //   var userss = users;
  // } else if (users.toString().match(/^[0-9]+$/) && users.length > 9) {
  //   var method = "Phone";
  //   var userss = users;
  // } else if (
  //   users.toString().length === 20 &&
  //   users.toString().match(/^[0-9]+$/)
  // ) {
  //   var method = "UUID";
  //   var userss = parseInt(users);
  // } else {
  //   var method = "Username";
  //   var userss = users;
  // }

  //find user in the main database
  const user = JSON.parse(fs.readFileSync(userdatabase, "utf-8"));
  const finduser = user.find((user) => user.UUID === users);

  if (!finduser) {
    return res.status(404).json({
      code: 404,
      having: false,
      message: "User not found",
      data: {},
    });
  }

  //find the user in the ticket database
  const ticket = ticketData.find((ticket) => ticket.UUID === users);
  if (!ticket) {
    return res.status(404).json({
      code: 404,
      having: false,
      message: "User not buy any ticket yet",
      data: {},
    });
  }

  //check array transaction of the user
  const transactions = ticket.Transaction;
  if (transactions.length === 0) {
    return res.status(404).json({
      code: 404,
      having: false,
      message: "User not have any ticket",
      data: {},
    });
  }

  //record index if the status is "on success"
  const success = transactions.filter(
    (transaction) => transaction.Payment.Status === "on success"
  );
  if (success.length === 0) {
    return res.status(404).json({
      code: 404,
      having: false,
      message: "User not have any success ticket",
      data: {},
    });
  }

  //check type of the ticket if in the success transaction include Ticket.ProductId === 1xx is offline ticket, if === 2xx is online ticket
  const offline = success.filter((transaction) => transaction.Ticket.ProductId < 200);
  const online = success.filter((transaction) => transaction.Ticket.ProductId > 200);

  const countOffline = offline.length;
  const countOnline = online.length;

  //return the success ticket
  const jsonresult = {
    code: 200,
    message: "Success",
    having: true,
    data: {
      UUID: ticket.UUID,
      Name: ticket.Name,
      Username: ticket.Username,
      Email: ticket.Email,
      Phone: ticket.Phone,
      Have_Ticket: success.length,
      Offline_Ticket: countOffline,
      Online_Ticket: countOnline,
      Total_Transaction: transactions.length,
      Transactions_Success: `${success.length} success of ${transactions.length} transaction`,
      Ticket: success,
      All_Transactions: transactions,
    },
  };

  res.status(200).json(jsonresult);
});

module.exports = router;
