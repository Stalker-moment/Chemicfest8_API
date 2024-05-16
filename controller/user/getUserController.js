const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

const maindatabase = './db/maindata.json';

router.get("/get/user", (req, res) => {
    const UUID = parseInt(req.query.uuid) || parseInt(req.body.UUID);
    const Email = req.query.email;
    const username = req.query.username;
    const phone = req.query.phone;

    if (UUID && !Email && !username && !phone) {
        //read the main database   
        fs.readFile(maindatabase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send("Internal Server Error");
            } else {
                const users = JSON.parse(data);
                const user = users.find((user) => user.UUID === UUID);
                if (user) {
                    const formattedJson = JSON.stringify(user, null, 2);
  
                    // Mengirimkan JSON langsung sebagai respons HTTP
                    res.setHeader('Content-Type', 'application/json');
                    res.send(formattedJson);
                } else {
                    res.status(404).json({ code: 404, message: "User not found" });
                }
            }
        });

    } else if (Email && !UUID && !username && !phone) { 
        //read the main database   
        fs.readFile(maindatabase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send("Internal Server Error");
            } else {
                const users = JSON.parse(data);
                const user = users.find((user) => user.Email === Email);
                if (user) {
                    const formattedJson = JSON.stringify(user, null, 2);
  
                    // Mengirimkan JSON langsung sebagai respons HTTP
                    res.setHeader('Content-Type', 'application/json');
                    res.send(formattedJson);
                } else {
                    res.status(404).json({ code: 404, message: "User not found" });
                }
            }
        });
    } else if (username && !UUID && !Email && !phone) {
        //read the main database   
        fs.readFile(maindatabase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send("Internal Server Error");
            } else {
                const users = JSON.parse(data);
                const user = users.find((user) => user.Username === username);
                if (user) {
                    const formattedJson = JSON.stringify(user, null, 2);
  
                    // Mengirimkan JSON langsung sebagai respons HTTP
                    res.setHeader('Content-Type', 'application/json');
                    res.send(formattedJson);
                } else {
                    res.status(404).json({ code: 404, message: "User not found" });
                }
            }
        });
    } else if (phone && !UUID && !Email && !username) {
        //read the main database   
        fs.readFile(maindatabase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send("Internal Server Error");
            } else {
                const users = JSON.parse(data);
                const user = users.find((user) => user.Phone === phone);
                if (user) {
                    const formattedJson = JSON.stringify(user, null, 2);
  
                    // Mengirimkan JSON langsung sebagai respons HTTP
                    res.setHeader('Content-Type', 'application/json');
                    res.send(formattedJson);
                } else {
                    res.status(404).json({ code: 404, message: "User not found" });
                }
            }
        });
    } else {
        res.status(400).json({ code: 400, message: "Bad Request" });
    }
});

module.exports = router;
