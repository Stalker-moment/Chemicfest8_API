const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

const maindatadb = "./db/maindata.json";
const ticketdb = "./db/ticket_storage.json";

router.post("/validate/ticket", (req, res) => {
  let { bookingCode } = req.body;

  //replace all " with blank
  bookingCode = bookingCode.replace(/"/g, "");

  //console.log(bookingCode)

  if (!bookingCode) {
    return res.status(400).json({ message: "Invalid request" });
  }

  //20 digit pertama dari tickid adalah uuid
  const uuidraw = bookingCode.slice(0, 20);
  const uuid = parseInt(uuidraw);

  // console.log(uuidraw)
  // console.log(uuid)

  //6 digit setelah uuid adalah booking code
  const tickid = bookingCode.slice(20, 26);

  // console.log(tickid)

  //4 digit terakhir adalah passcode
  const tickpass = bookingCode.slice(26, 30);

  // console.log(tickpass)

  const maindata = JSON.parse(fs.readFileSync(maindatadb, "utf-8"));
  const userfind = maindata.find((user) => user.UUID === uuid);

  if (!userfind) {
    return res.status(400).json({ code: 400, valid: false, message: "User not found", data: null });
  }

  const ticketdata = JSON.parse(fs.readFileSync(ticketdb, "utf-8"));

  //find user in ticket data
  const ticketuserfind = ticketdata.find((user) => user.UUID === uuid);

  if (!ticketuserfind) {
    return res.status(400).json({ code: 400, valid: false, message: "User not found", data: null });
  }

  //find ticket in transaction data
  const ticketfind = ticketuserfind.Transaction.find(
    (ticket) => ticket.Ticket.BookingCode === tickid
  );

  if (!ticketfind) {
    return res.status(400).json({ code: 400, valid: false, message: "Ticket not found", data: null });
  }

  if (ticketfind.Ticket.PassCode !== tickpass) {
    return res.status(400).json({ code: 400, valid: false, message: "Ticket not found", data: null });
  }

  const datauser = {
    UUID: userfind.UUID,
    Name: userfind.Name,
    Username: userfind.Username,
    Email: userfind.Email,
    Phone: userfind.Phone,
    Role: userfind.Role,
    Details: userfind.Details,
    Part_Of: userfind.Part_Of,
    Image_1 : userfind.Attachment.Image_1,
    Image_2 : userfind.Attachment.Image_2,
    ProductId: ticketfind.Ticket.ProductId,
    TypeTicket: ticketfind.Ticket.Type,
    TicketId: ticketfind.Ticket.BookingCode,
    TicketPass: ticketfind.Ticket.PassCode,
  };

  //console.log(datauser)

  return res.status(200).json({ code: 200, message: "Ticket is valid", valid: true, data: datauser });
});

module.exports = router;
