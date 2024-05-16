const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const nodemailer = require("nodemailer");
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
const otpstore = "./db/otp_storage.json";
const config = "./db/config.json";

function generateOTP() {
  var otp = "";
  for (var i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

function sendEmail(email, name, otp) {
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
    subject: "Kode OTP Chemicfest#8",
    html: `
        <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #e3a456;text-decoration:none;font-weight:600">Chemicfest#8</a>
          </div>
          <p style="font-size:1.1em">Hi, ${name}</p>
          <p>Terimakasih telah melakukan regristrasi Chemicfest#8. Silakan gunakan kode OTP ini untuk melanjutkan regristrasi. OTP is valid for 5 minutes</p>
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
        `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(chalk.cyan(dateformat()), error);
      return error;
    } else {
      console.log(chalk.cyan(dateformat()), "Email sent: " + info.response + " to " + email + "Action : Send OTP");
      return info.response;
    }
  });
}

function sendWhatsapp(phone, name, otp) {
  const gethost = JSON.parse(fs.readFileSync(config));
  const { url_api } = gethost.WhatsappOTP;

  const msg = `Hi ${name}

*${otp}* adalah kode verifikasi Anda. 
kode ini berlaku selama 5 menit.

Demi keamanan, jangan berikan kode ini kepada siapapun. 
Terimakasih telah melakukan regristrasi Chemicfest#8`;

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

router.post("/validation/getotp", (req, res) => {
  const { users } = req.body;

  if (!users) {
    return res.status(400).json({
      code: 400,
      message: "Invalid data",
    });
  }

  if (users.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    var method = "email";
  } else if (users.match(/^[0-9]+$/) && users.length > 9) {
    var method = "phone";
  } else {
    return res.status(400).json({
      code: 400,
      message: "Invalid data",
    });
  }

  if (method === "email") {
    //check if email exists
    const maindata = fs.readFileSync(maindatabase);
    const data = JSON.parse(maindata);
    //console.log(data);
    const user = data.find((user) => user.Email === users);

    //console.log(user);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "Email not found",
      });
    } else {
      //check if email verified
      if(user.Verified.Method !== "OTP") {
        return res.status(400).json({
          code: 400,
          message: "This account is not using OTP verification method. Please contact admin for further information.",
        });
      }
      
      if (user.Verified.Email) {
        return res.status(400).json({
          code: 400,
          message: "Email already verified",
        });
      }
      //find user in otp storage
      const otpdata = fs.readFileSync(otpstore);
      const otps = JSON.parse(otpdata);
      const userotp = otps.find((user) => user.Email === users);
      if (userotp) {
        //check if last otp is empty(array Otp is empty)
        const checkempty = userotp.Otp.length;

        if (checkempty === 0) {
          const otp = generateOTP();
          //expired after 5 minutes
          const otpdta = {
            Code: otp,
            Method: "email",
            Url: "https://www.google.com",
            Expired: Date.now() + 300000,
          };
          userotp.Otp.push(otpdta);
          fs.writeFileSync(otpstore, JSON.stringify(otps, null, 2));

          //send email
          const email = user.Email;
          const name = user.Name;
          const response = sendEmail(email, name, otp);

          if (response instanceof Error) {
            return res.status(500).json({
              code: 500,
              message: "Internal Server Error",
              error: response.message,
            });
          }

          return res.status(200).json({
            code: 200,
            message: "OTP sent successfully",
            data: otpdta,
            response: response,
          });
        } else {
          //check last otp sent time (if less than 5 minutes, return error)
          const lastotp = userotp.Otp[userotp.Otp.length - 1];
          if (lastotp.Expired > Date.now() && lastotp.Method === "email") {
            return res.status(400).json({
              code: 400,
              message:
                "Please wait for 5 minutes before requesting another OTP",
            });
          }
          const otp = generateOTP();
          //expired after 5 minutes
          const otpdta = {
            Code: otp,
            Method: "email",
            Url: "https://www.google.com",
            Expired: Date.now() + 300000,
          };
          userotp.Otp.push(otpdta);
          fs.writeFileSync(otpstore, JSON.stringify(otps, null, 2));

          //send email
          const email = user.Email;
          const name = user.Name;
          const response = sendEmail(email, name, otp);

          if (response instanceof Error) {
            return res.status(500).json({
              code: 500,
              message: "Please retry again",
              error: response.message,
            });
          }

          console.log(chalk.cyan(dateformat()), chalk.green(`[OTP]`), chalk.blue(`${user.Name}`), chalk.white(`OTP sent successfully for ${user.Email}`));
          return res.status(200).json({
            code: 200,
            message: "OTP sent successfully",
            data: otpdta,
            response: response,
          });
        }
      } else {
        return res.status(404).json({
          code: 404,
          message: "Please register first",
        });
      }
    }
  } else if (method === "phone") {
    //check if phone exists
    const maindata = fs.readFileSync(maindatabase);
    const data = JSON.parse(maindata);
    const user = data.find((user) => user.Phone === users);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "Phone not found, please use 62",
      });
    } else {
      //check if email verified
      if (user.Verified.Phone) {
        return res.status(400).json({
          code: 400,
          message: "Phone already verified",
        });
      }

      if(user.Verified.Method !== "OTP") {
        return res.status(400).json({
          code: 400,
          message: "This account is not using OTP verification method. Please contact admin for further information.",
        });
      }

      //find user in otp storage
      const otpdata = fs.readFileSync(otpstore);
      const otps = JSON.parse(otpdata);
      const userotp = otps.find((user) => user.Phone === users);
      if (userotp) {
        //check if last otp is empty (array Otp is empty)
        const checkempty = userotp.Otp.length;
        if (checkempty === 0) {
          const otp = generateOTP();
          //expired after 5 minutes
          const otpdta = {
            Code: otp,
            Method: "phone",
            Url: "https://www.google.com",
            Expired: Date.now() + 300000,
          };
          userotp.Otp.push(otpdta);
          fs.writeFileSync(otpstore, JSON.stringify(otps, null, 2));

          //send whatsapp
          const phone = user.Phone;
          const name = user.Name;
          const response = sendWhatsapp(phone, name, otp);

          if (response instanceof Error) {
            return res.status(500).json({
              code: 500,
              message: "Please retry again",
              error: response.message,
            });
          }

          console.log(chalk.cyan(dateformat()), chalk.green(`[OTP]`), chalk.blue(`${user.Name}`), chalk.white(`OTP sent successfully for ${user.Phone}`));
          return res.status(200).json({
            code: 200,
            message: "OTP sent successfully",
            data: otpdta,
            response: response,
          });
        } else {
          //check last otp sent time (if less than 5 minutes, return error)
          const lastotp = userotp.Otp[userotp.Otp.length - 1];
          if (lastotp.Expired > Date.now() && lastotp.Method === "phone") {
            return res.status(400).json({
              code: 400,
              message:
                "Please wait for 5 minutes before requesting another OTP",
            });
          }
          const otp = generateOTP();
          //expired after 5 minutes
          const otpdta = {
            Code: otp,
            Method: "phone",
            Url: "https://www.google.com",
            Expired: Date.now() + 300000,
          };
          userotp.Otp.push(otpdta);
          fs.writeFileSync(otpstore, JSON.stringify(otps, null, 2));
          //send whatsapp
          const phone = user.Phone;
          const name = user.Name;
          const response = sendWhatsapp(phone, name, otp);

          if (response instanceof Error) {
            return res.status(500).json({
              code: 500,
              message: "Internal Server Error",
              error: response.message,
            });
          }

          return res.status(200).json({
            code: 200,
            message: "OTP sent successfully",
            data: otpdta,
            response: response,
          });
        }
      } else {
        return res.status(404).json({
          code: 404,
          message: "Please register first",
        });
      }
    }
  }
});

module.exports = router;
