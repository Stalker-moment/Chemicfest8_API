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

const maindatabase = './db/maindata.json';

router.post("/logout", (req, res) => {
    const session = req.body.session;

    fs.readFile(maindatabase, "utf8", (err, data) => {
        if (err) {
            console.log(err);
        } else {
            const maindata = JSON.parse(data);
            // Find the user with the session (in array)
            const user = maindata.find((u) => u.Main_Session.includes(session));
            //jika tidak ditemukan
            if (!user) {
                return res.status(200).json({ code: 200, message: "Logged out, but session expired" });
            }
            console.log(user.Name)
            if (user) {
                // Remove the session from the user (array)
                
                //find in index array
                const index = user.Main_Session.indexOf(session);
                

                //delete session and expired by index
                if (index > -1) {
                    user.Main_Session.splice(index, 1);
                    user.Expired_Main_Session.splice(index, 1);
                }

                // Decrease the Now_Main_Session count
                user.Now_Main_Session -= 1;
                // Write the new data to the file
                fs.writeFile(maindatabase, JSON.stringify(maindata, null, 2), (err) => {
                    if (err) {
                        console.log(chalk.cyan(dateformat()), err);
                    } else {
                        console.log(chalk.cyan(dateformat()), `User ${user.Name} logged out`);
                        res.status(200).json({ code: 200, message: "Logged out" });
                    }
                });
            } else {
                res.status(404).json({ code: 404, message: "User not found" });
            }
        }
    });
});

module.exports = router;
