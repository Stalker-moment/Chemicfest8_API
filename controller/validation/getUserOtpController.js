const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const uuid = require("uuid");
const axios = require("axios");

const maindatabase = "./db/maindata.json";
const otpstore = "./db/otp_storage.json";

router.post("/check/otp", (req, res) => {
    const { users } = req.body;

    //detect method
  if (users.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    var method = "email";
    var metode = "Email";
  } else if (users.match(/^[0-9]+$/) && users.length > 9) {
    var method = "phone";
    var metode = "Phone";
  } else {
    res.status(400).json({ message: "Invalid input" });
    return;
    }

    //check if user exists
    var data = JSON.parse(fs.readFileSync(maindatabase, "utf-8"));
    var user = data.find((user) => user[metode] === users);
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }

    //send data otp
    var dataotp = JSON.parse(fs.readFileSync(otpstore, "utf-8"));
    var otp = dataotp.find((otp) => otp[metode] === users);
    if (!otp) {
        res.status(404).json({ message: "OTP not found" });
        return;
    }

    //send data 
    var formattedJson = JSON.stringify(otp, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.send(formattedJson);
    res.status(200).json(otp);

});

module.exports = router;