var nodemailer = require('nodemailer');
var name = 'Muhammad Tier Sinyo Cahyo Utomo Suharjo';

var transporter = nodemailer.createTransport({
  host: 'mx3.mailspace.id',
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: 'noreply@chemicfest.com',
    pass: 'XXXXXXXXXXX'
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
  from: 'noreply@chemicfest.com',
  to: 'masterofmoney88@gmail.com',
  subject: 'Kode OTP Chemicfest#8',
  html: `
  <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
  <div style="margin:50px auto;width:70%;padding:20px 0">
    <div style="border-bottom:1px solid #eee">
      <a href="" style="font-size:1.4em;color: #e3a456;text-decoration:none;font-weight:600">Chemicfest#8</a>
    </div>
    <p style="font-size:1.1em">Hi, ${name}</p>
    <p>Terimakasih telah melakukan registrasi Chemicfest#8. Silakan gunakan kode OTP ini untuk melanjutkan registrasi. OTP is valid for 5 minutes</p>
    <h2 style="background: #e3a456;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
    <p style="font-size:0.9em;">Regards,<br />OSIS CHEMICALISTRONIC</p>
    <hr style="border:none;border-top:1px solid #eee" />
    <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
      <p>OSIS CHEMICALISTRONIC | CHEMICFEST#8</p>
      <p>Jl. Kusumanegara No.3, Semaki, Kec. Umbulharjo</p>
      <p>SMK SMTI YOGYAKARTA</p>
    </div>
  </div>
</div>
  `
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
