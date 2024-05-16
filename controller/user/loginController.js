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

router.post("/login", (req, res) => {
  const users = req.body.user;
  const pass = req.body.pass;
  
  //detect method
  if (users.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    var method = "email";
  } else if (users.match(/^[0-9]+$/) && users.length > 9) {
    var method = "phone";
  } else {
    var method = "username";
  }

  const sessionId = uuid.v4();
  //const ip = req.headers["x-forwarded-for"]
  //const ipinfo = getipinfo(ip);
      //find by username
      if(method == "username"){
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
      const userfound = maindata.find((user) => user.Username == users);
      //check password
      if (userfound) {
        if (userfound.Password === pass) {
          if (userfound.Now_Main_Session === userfound.Max_Main_Session) {
            res.status(402).json({code: 402, message: "Sudah mencapai max device!, tolong logout dari salah satu device untuk melanjutkan"})
            return;
          } else {
            //check verify
            if(userfound.Verified.Email ===  false && userfound.Verified.Phone === false && userfound.Verified.Method == "OTP"){
              res.status(403).json({code: 403, message: "Verifikasi belum dilakukan, silahkan verifikasi email atau nomor telepon anda terlebih dahulu!"})
              return;
            } 
            
            if(userfound.Verified.Email ===  false && userfound.Verified.Phone === false && userfound.Verified.Method == "MANUAL"){
              res.status(403).json({code: 405, message: "Akun anda dalam proses verifikasi, silahkan tunggu beberapa saat!"})
              return;
            }
            //write Main_Session on json type data array
            userfound.Main_Session.push(sessionId);
            userfound.Expired_Main_Session.push(Date.now() + 86400000); //1 day
            userfound.Now_Main_Session = userfound.Now_Main_Session + 1;
          
          fs.writeFile(
            maindatabase,
            JSON.stringify(maindata, null, 2),
            (err) => {
              if (err) {
                console.error(chalk.cyan(dateformat()), err);
                res
                  .status(500)
                  .json({ code: 500, error: "Internal Server Error" });
                addLogError(
                  "logincontroller.js",
                  "api/login",
                  500,
                  "Internal Server Error"
                );
                return;
              };
          });
          } 
          //console.log(chalk.blue(`${userfound.Name} Login successful, sessionId: ${sessionId} Using ${method} method`))
          console.log(chalk.cyan(dateformat()), chalk.green(`[LOGIN]`), chalk.blue(`${userfound.Name}`), chalk.white(`Login successful, Using ${method}`), chalk.inverse(`SessionId: ${sessionId}`), chalk.white(`.`));
          res.status(200).json({ code: 200, message: "Login successful", sessionId, data: userfound });
        } else {
          res.status(401).json({ code: 401, message: "Incorrect password" });
        }
      } else {
        res.status(401).json({ code: 401, message: "Username Not Found" });
      }
    });
    } else if(method == "email"){
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
      //console.log(maindata)
      const userfound = maindata.find((user) => user.Email == users);
      if(userfound){
        if(userfound.Email === users){
          if(userfound.Password === pass){
            if (userfound.Now_Main_Session === userfound.Max_Main_Session) {
              res.status(402).json({code: 402, message: "Sudah mencapai max device!, tolong logout dari salah satu device untuk melanjutkan"})
              return;
            } else {
              //check verify
            if(userfound.Verified.Email ===  false && userfound.Verified.Phone === false && userfound.Verified.Method == "OTP"){
              res.status(403).json({code: 403, message: "Verifikasi belum dilakukan, silahkan verifikasi email atau nomor telepon anda terlebih dahulu!"})
              return;
            } 
            
            if(userfound.Verified.Email ===  false && userfound.Verified.Phone === false && userfound.Verified.Method == "MANUAL"){
              res.status(403).json({code: 405, message: "Akun anda dalam proses verifikasi, silahkan tunggu beberapa saat!"})
              return;
            }
              //write Main_Session on json type data array
              userfound.Main_Session.push(sessionId);
              userfound.Expired_Main_Session.push(Date.now() + 86400000); //1 day
              userfound.Now_Main_Session = userfound.Now_Main_Session + 1;
            
            fs.writeFile(
              maindatabase,
              JSON.stringify(maindata, null, 2),
              (err) => {
                if (err) {
                  console.error(chalk.cyan(dateformat()), err);
                  res
                    .status(500)
                    .json({ code: 500, error: "Internal Server Error" });
                  addLogError(
                    "logincontroller.js",
                    "api/login",
                    500,
                    "Internal Server Error"
                  );
                  return;
                };
            });
            }
            console.log(chalk.cyan(dateformat()), chalk.green(`[LOGIN]`), chalk.blue(`${userfound.Name}`), chalk.white(`Login successful, Using ${method}`), chalk.inverse(`SessionId: ${sessionId}`), chalk.white(`.`));
            res.status(200).json({ code: 200, message: "Login successful", sessionId, data: userfound });
          } else {
            res.status(401).json({ code: 401, message: "Incorrect password" });
          }
        } else {
          res.status(401).json({ code: 401, message: "Email Not Found" });
        }
      } else {
        res.status(401).json({ code: 401, message: "Email Not Found" });
      }
    });
    } else if(method == "phone"){
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
      const userfound = maindata.find((user) => user.Phone == users);
      if(userfound){
        if(userfound.Phone === users){
          if(userfound.Password === pass){
            if (userfound.Now_Main_Session === userfound.Max_Main_Session) {
              res.status(402).json({code: 402, message: "Sudah mencapai max device!, tolong logout dari salah satu device untuk melanjutkan"})
              return;
            } else {
              //check verify
            if(userfound.Verified.Email ===  false && userfound.Verified.Phone === false && userfound.Verified.Method == "OTP"){
              res.status(403).json({code: 403, message: "Verifikasi belum dilakukan, silahkan verifikasi email atau nomor telepon anda terlebih dahulu!"})
              return;
            } 
            
            if(userfound.Verified.Email ===  false && userfound.Verified.Phone === false && userfound.Verified.Method == "MANUAL"){
              res.status(403).json({code: 405, message: "Akun anda dalam proses verifikasi, silahkan tunggu beberapa saat!"})
              return;
            }
              //write Main_Session on json type data array
              userfound.Main_Session.push(sessionId);
              userfound.Expired_Main_Session.push(Date.now() + 86400000); //1 day
              userfound.Now_Main_Session = userfound.Now_Main_Session + 1;
            
            fs.writeFile(
              maindatabase,
              JSON.stringify(maindata, null, 2),
              (err) => {
                if (err) {
                  console.error(chalk.cyan(dateformat()), err);
                  res
                    .status(500)
                    .json({ code: 500, error: "Internal Server Error" });
                  addLogError(
                    "logincontroller.js",
                    "api/login",
                    500,
                    "Internal Server Error"
                  );
                  return;
                };
            });
            }
            console.log(chalk.cyan(dateformat()), chalk.green(`[LOGIN]`), chalk.blue(`${userfound.Name}`), chalk.white(`Login successful, Using ${method}`), chalk.inverse(`SessionId: ${sessionId}`), chalk.white(`.`));
            res.status(200).json({ code: 200, message: "Login successful", sessionId, data: userfound});
          } else {
            res.status(401).json({ code: 401, message: "Incorrect password" });
          }
        } else {
          res.status(401).json({ code: 401, message: "Phone Not Found" });
        }
      } else {
        res.status(401).json({ code: 401, message: "Phone Not Found" });
      }
    });
    } else {
      res.status(400).json({code: 400, message: "Bad Requet, request method not found"})
    }
});

module.exports = router;