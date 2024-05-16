const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
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

router.post("/validation/giveotp", (req, res) => {
    const { users, code } = req.body;

    if (users.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
        var method = "email";
        var metode = "Email";
      } else if (users.match(/^[0-9]+$/) && users.length > 9) {
        var method = "phone";
        var metode = "Phone";
      } else {
        return res.status(400).json({
          code: 400,
          message: "Email/Phone Not Found",
        });
      }

    const data = JSON.parse(fs.readFileSync(maindatabase, "utf-8"));
    const user = data.find((user) => user[metode] === users);
    if (!user) {
        return res.status(404).json({
            code: 404,
            message: "User not found",
        });
    }

    const otpdata = JSON.parse(fs.readFileSync(otpstore, "utf-8"));
    const otpuser = otpdata.find((user) => user[metode] === users);

    if (otpuser) {
        //find otp match at Otp Storage (array)
        //check length of otp
        if (otpuser.Otp.length === 0) {
            return res.status(404).json({
                code: 404,
                message: "OTP not found or expired",
            });
        }
        const otpmatch = otpuser.Otp.find((Otp) => Otp.Code === code);

        //check otp match
        if (!otpmatch) {
            return res.status(400).json({
                code: 400,
                message: "OTP not match",
            });
        }
        
        //console.log(otpmatch);
        //check expired time
        const expired = otpmatch.Expired;
        const now = new Date().getTime();
        //console.log(expired);
        //console.log(now);
        if (now > expired) {
            return res.status(400).json({
                code: 400,
                message: "OTP Expired",
            });
        }

        //check otp method users with database not match
        if (otpmatch.Method !== method) {
            return res.status(400).json({
                code: 400,
                message: "OTP Method not match",
            });
        }

        if (otpmatch) {
            //write to maindata & otp_storage verify status
            if (method === "email") {
                user.Verified.Email = true;
                otpuser.Verified.Email = true;
            } else {
                user.Verified.Phone = true;
                otpuser.Verified.Phone = true;
            }

            //delete code section otp from otp_storage
            const index = otpuser.Otp.indexOf(otpmatch);
            if (index > -1) {
                otpuser.Otp.splice(index, 1);
            }

            fs.writeFileSync(maindatabase, JSON.stringify(data, null, 2));
            fs.writeFileSync(otpstore, JSON.stringify(otpdata, null, 2));
            console.log(chalk.cyan(dateformat()), chalk.green(`[VERIFICATION]`), chalk.blue(`${user.Name}`), chalk.white(`verified ${method} successfully`), chalk.inverse(`OTP: ${code}`), chalk.white(`.`));
            return res.status(200).json({
                code: 200,
                message: "Verify Success",
            });
        }
    } else {
        return res.status(404).json({
            code: 404,
            message: "OTP not found",
        });
    }
});

module.exports = router;
