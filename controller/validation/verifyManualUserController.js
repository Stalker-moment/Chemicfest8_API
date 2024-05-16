const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const nodemailer = require("nodemailer");

const maindatabase = './db/maindata.json';
const otpdatabase = './db/otp_storage.json';
const config = './db/config.json';

function sendEmail(email, name) {
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
    subject: "Chemicfest#8 Account Activated",
    html: `
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Activated</title>
  <style>
    @font-face {
      font-family: "Signika";
      src: url("https://fonts.gstatic.com/s/signika/v13/vEFU2_JTCgwQ5ejvE_oEI3A.ttf");
    }

    @font-face {
      font-family: "Montserrat";
      src: url("https://fonts.gstatic.com/s/montserrat/v15/JTURjIg1_i6t8kCHKm45_aZA3gTD_u50.woff2");
    }

    body {
      margin: 0;
      padding: 0;
      font-family: "Signika", sans-serif;
      max-width: 1000px;
      margin: auto;
    }

    .container {
      padding-top: 12px;
      padding-bottom: 6px;
    }

    .logo {
      width: 20%;
      display: block;
      margin: 0 auto;
    }

    .message {
      text-align: center;
      margin-top: 6px;
      margin-bottom: 12px;
    }

    .message p {
      font-size: 20px;
      color: #333;
    }

    .login-btn {
      background-color: #FC664E;
      color: #fff;
      padding: 10px 20px;
      border-radius: 5px;
      text-decoration: none;
      display: inline-block;
      margin-top: 12px;
    }

    .footer {
      text-align: center;
      padding-bottom: 6px;
      font-family: "Montserrat", sans-serif;
      font-size: 14px;
      color: #777;
    }

    h1 {
      text-align: center;
    }
  </style>
</head>

<body>
  <div class="container">
    <h1 class="text-3xl text-center text-gray-800">Account Activated</h1>
    <img class="logo" src="https://chemicfest.site/file/assets/done-verify.png" alt="">
    <div class="message">
    <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you, your email has been verified. Your account is now active.</p>
      <p>Please use the link below to login to your account.</p>
      <a href="https://chemicfest.com/login" class="login-btn">LOGIN TO YOUR ACCOUNT</a>
    </div>
    <div class="footer">
      <p><a href="https://chemicfest.com" style="color: black; font-weight: bold; text-decoration: none;">Chemicfest#8</a> | Managed by <a href="https://instagram.com/chemicevents" style="color: black; font-weight: bold; text-decoration: none;">OSIS SMK SMTI YOGYAKARTA</a></p>
    </div>
  </div>
</body>

</html>
        `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return error;
    } else {
      console.log("Email sent: " + info.response + " to " + email + "Action : Verify Account Manual");
      return info.response;
    }
  });
}

router.post("/verify/manual/user", async (req, res) => {
    const users = req.body.users; //UUID

    let maindata = JSON.parse(fs.readFileSync(maindatabase, "utf-8"));
    let otpdata = JSON.parse(fs.readFileSync(otpdatabase, "utf-8"));

    //find user in maindata
    const user = maindata.find((user) => user.UUID === users);
    if (!user) {
        return res.status(404).json({
            code: 404,
            message: "User not found",
        });
    }

    //find user in otpdata
    const otp = otpdata.find((otp) => otp.Email === user.Email);
    if (!otp) {
        return res.status(404).json({
            code: 404,
            message: "Databases not found",
        });
    }

    //check validity in maindata
    if(user.Verified.Method !== "MANUAL"){
        return res.status(403).json({
            code: 403,
            message: "User is not in manual verification",
        });
    }

    if(user.Verified.Email === true && user.Verified.Phone === true){
        return res.status(403).json({
            code: 403,
            message: "User is already verified",
        });
    }

    //verify user
    user.Verified.Email = true;
    user.Verified.Phone = true;
    fs.writeFileSync(maindatabase, JSON.stringify(maindata, null, 2));

    //verify on otpdata
    otp.Verified.Email = true;
    otp.Verified.Phone = true;
    fs.writeFileSync(otpdatabase, JSON.stringify(otpdata, null, 2));

    //send email
    sendEmail(user.Email, user.Name);

    res.status(200).json({
        code: 200,
        message: "User verified",
    });
});

module.exports = router;




