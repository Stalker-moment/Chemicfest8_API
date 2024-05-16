const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const chalk = require("chalk");

const maindatadb = "./db/maindata.json";
const ticketdb = "./db/ticket_storage.json";
const checkindb = "./db/checkin_storage.json";

router.post("/checkin/ticket", (req, res) => {
    let { bookingCode } = req.body;

    if (!bookingCode) {
      return res.status(400).json({ message: "Invalid request" });
    }

    //replace all " with blank
    bookingCode = bookingCode.replace(/"/g, "");
  
    //20 digit pertama dari tickid adalah uuid
    const uuidraw = bookingCode.slice(0, 20);
    const uuid = parseInt(uuidraw);
  
    //6 digit setelah uuid adalah booking code
    const tickid = bookingCode.slice(20, 26);
  
    //4 digit terakhir adalah passcode
    const tickpass = bookingCode.slice(26, 30);

  const maindata = JSON.parse(fs.readFileSync(maindatadb, "utf-8"));
  const userfind = maindata.find((user) => user.UUID === uuid);

  if (!userfind) {
    return res.status(400).json({ code: 400, valid: false, message: "User not found, Failed Check In", data: null });
  }

  const ticketdata = JSON.parse(fs.readFileSync(ticketdb, "utf-8"));

  //find user in ticket data
  const ticketuserfind = ticketdata.find((user) => user.UUID === uuid);

  if (!ticketuserfind) {
    return res.status(400).json({ code: 400, valid: false, message: "User not found, Failed Check In", data: null });
  }

  //find ticket in transaction data
  const ticketfind = ticketuserfind.Transaction.find(
    (ticket) => ticket.Ticket.BookingCode === tickid
  );

  if (!ticketfind) {
    return res.status(400).json({ code: 400, valid: false, message: "Ticket not found, Failed Check In", data: null });
  }

  if (ticketfind.Ticket.PassCode !== tickpass) {
    return res.status(400).json({ code: 400, valid: false, message: "Ticket not found, Failed Check In", data: null });
  }

  //find user in checkin data using UUID
    const checkindata = JSON.parse(fs.readFileSync(checkindb, "utf-8"));
    const checkinuserfind = checkindata.find((user) => user.UUID === userfind.UUID);
    if(checkinuserfind){
        return res.status(400).json({ code: 400, valid: false, message: "User already check in", data: null });
    }

  const timestampISO = new Date().toISOString();
  const timestampms = new Date().getTime();

  const datauser = {
    CheckInTime: timestampISO,
    CheckInTimeMs: timestampms,
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

    //push data checkin
    checkindata.push(datauser);
    fs.writeFileSync(checkindb, JSON.stringify(checkindata, null, 2));

    console.log(chalk.green(`[SUCCESS] Check In Ticket ${datauser.Name} with Ticket ID ${datauser.TicketId}`));
  return res.status(200).json({ code: 200, message: "Ticket is valid, Success Check In", valid: true, data: datauser });
});

module.exports = router;
