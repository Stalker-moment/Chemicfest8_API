var nodemailer = require('nodemailer');
var name = 'Muhammad Tier Sinyo Cahyo Utomo Suharjo';

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'XXXXXXXXXXXXXXXX',
    pass: 'XXXXXXXXXXXXXXXXX'
  }
});

// Fungsi untuk membuat kode OTP acak
function generateOTP() {
  var otp = '';
  for (var i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

var otp = generateOTP(); // Menghasilkan kode OTP

var mailOptions = {
  from: 'botsinchan@gmail.com',
  to: 'masterofmoney88@gmail.com',
  subject: 'Account Activation',
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
      <p>Hello John,</p>
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
  `
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
