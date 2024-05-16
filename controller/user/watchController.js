const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const uuid = require("uuid");
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
const config = './db/config.json';

const configuration = fs.readFileSync(config);
const configdata = JSON.parse(configuration);

const steaminginfo = configdata.StreamUrl;

// async function getipinfo(ip) {
//   try {
//     const response = await axios.get(`http://ipinfo.io/${ip}/json`);
//     const data = response.data;

//     return data;
//   } catch (error) {
//     console.log(error);
//     return "error";
//   }
// }

router.post("/watch", (req, res) => {
  const users = req.body.user;
  //const force = req.body.force;

  //detect method
  if (
    users.toString().match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
  ) {
    var method = "Email";
    var userss = users;
  } else if (users.toString().match(/^[0-9]+$/) && users.length > 9) {
    var method = "Phone";
    var userss = users;
  } else if (
    users.toString().length === 20 &&
    users.toString().match(/^[0-9]+$/)
  ) {
    var method = "UUID";
    var userss = parseInt(users);
  } else {
    var method = "Username";
    var userss = users;
  }

  if (!method) {
    res.status(400).json({ code: 400, message: "Invalid input" });
    return;
  }

  const sessionId = uuid.v4();
  //const ip = req.headers["x-forwarded-for"]
  //const ipinfo = getipinfo(ip);
  //find by username
  fs.readFile(maindatabase, (err, data) => {
    if (err) {
      console.error(chalk.cyan(dateformat()), err);
      res.status(500).json({ code: 500, error: "Internal Server Error" });
      addLogError(
        "logincontroller.js",
        "api/login",
        500,
        "Internal Server Error"
      );
      return;
    }
    const maindata = JSON.parse(data);
    const userfound = maindata.find((user) => user[method] == userss);
    //check password
    if (userfound) {
      if (userfound.Now_Session === userfound.Max_Session) {
        res
          .status(402)
          .json({
            code: 402,
            message:
              "Sudah mencapai max device!, tolong logout dari salah satu device untuk melanjutkan",
          });
        return;
      } else {
        //check verify
        if (
          userfound.Verified.Email === false &&
          userfound.Verified.Phone === false
        ) {
          res
            .status(403)
            .json({
              code: 403,
              message:
                "Verifikasi belum dilakukan, silahkan verifikasi email atau nomor telepon anda terlebih dahulu!",
            });
          return;
        }
        //write Main_Session on json type data array
        userfound.Session.push(sessionId);
        userfound.Expired_Session.push(Date.now() + 86400000); //1 day
        userfound.Now_Session = userfound.Now_Session + 1;

        fs.writeFile(maindatabase, JSON.stringify(maindata, null, 2), (err) => {
          if (err) {
            console.error(chalk.cyan(dateformat()), err);
            res.status(500).json({ code: 500, error: "Internal Server Error" });
            addLogError(
              "logincontroller.js",
              "api/login",
              500,
              "Internal Server Error"
            );
            return;
          }
        });
      }
      //console.log(chalk.blue(`${userfound.Name} Login successful, sessionId: ${sessionId} Using ${method} method`))
      console.log(
        chalk.cyan(dateformat()), 
        chalk.green(`[WATCH]`),
        chalk.blue(`${userfound.Name}`),
        chalk.white(`Watch successful, Using ${method}`),
        chalk.inverse(`SessionId: ${sessionId}`),
        chalk.white(`.`)
      );
      res
        .status(200)
        .json({
          code: 200,
          message: "Login successful",
          sessionId,
          StreamUrl: steaminginfo,
          data: userfound,
        });
    } else {
      res.status(401).json({ code: 401, message: "Username Not Found" });
    }
  });
});

module.exports = router;
