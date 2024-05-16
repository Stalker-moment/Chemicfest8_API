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

const maindatadb = "./db/maindata.json";

router.get("/clear/mod/all/session", (req, res) => {
    //read the maindata.json file
    const data = fs.readFileSync(maindatadb);
    const maindata = JSON.parse(data);

    //clear the session in all user
    maindata.forEach((user) => {
        user.Now_Main_Session = 0;
        user.Main_Session = [];
        user.Expired_Main_Session = [];
    });

    //write the new data to the maindata.json file
    fs.writeFileSync(maindatadb, JSON.stringify(maindata, null, 2));

    console.log(chalk.magenta(`${dateformat()}`), chalk.green(`All session has been cleared`));

    return res.status(200).json({ message: "All session has been cleared" });
});

module.exports = router;