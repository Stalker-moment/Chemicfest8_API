const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

const maindatabase = './db/maindata.json';

router.post("/edit/name", (req, res) => {
    const UUID = parseInt(req.body.uuid);
    const email = req.body.email;
    const username = req.body.username;
    const phone = req.body.phone;
    const newname = req.body.newname;

    if(UUID && !email && !username && !phone && newname) {
        fs.readFile(maindatabase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json({ code: 500, message: "Internal Server Error" });
            } else {
                const users = JSON.parse(data);
                const user = users.find((user) => user.UUID === UUID);
                if (user) {
                    user.Name = newname;
                    fs.writeFile(maindatabase, JSON.stringify(users, null, 2), (err) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({ code: 500, message: "Internal Server Error" });
                        } else {
                            console.log(`Name updated for user with UUID ${UUID}`);
                            res.status(200).json({ code: 200, message: "Name updated" });
                        }
                    });
                } else {
                    res.status(404).json({ code: 404, message: "User not found" });
                }
            }
        });
    } else if(!UUID && email && !username && !phone && newname) {
        fs.readFile(maindatabase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json({ code: 500, message: "Internal Server Error" });
            } else {
                const users = JSON.parse(data);
                const user = users.find((user) => user.Email === email);
                if (user) {
                    user.Name = newname;
                    fs.writeFile(maindatabase, JSON.stringify(users, null, 2), (err) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({ code: 500, message: "Internal Server Error" });
                        } else {
                            console.log(`Name updated for user with UUID ${UUID}`);
                            res.status(200).json({ code: 200, message: "Name updated" });
                        }
                    });
                } else {
                    res.status(404).json({ code: 404, message: "User not found" });
                }
            }
        });
    } else if(!UUID && !email && username && !phone && newname) {
        fs.readFile(maindatabase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json({ code: 500, message: "Internal Server Error" });
            } else {
                const users = JSON.parse(data);
                const user = users.find((user) => user.Username === username);
                if (user) {
                    user.Name = newname;
                    fs.writeFile(maindatabase, JSON.stringify(users, null, 2), (err) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({ code: 500, message: "Internal Server Error" });
                        } else {
                            console.log(`Name updated for user with UUID ${UUID}`);
                            res.status(200).json({ code: 200, message: "Name updated" });
                        }
                    });
                } else {
                    res.status(404).json({ code: 404, message: "User not found" });
                }
            }
        });
    } else if(!UUID && !email && !username && phone && newname) {
        fs.readFile(maindatabase, "utf8", (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json({ code: 500, message: "Internal Server Error" });
            } else {
                const users = JSON.parse(data);
                const user = users.find((user) => user.Phone === phone);
                if (user) {
                    user.Name = newname;
                    fs.writeFile(maindatabase, JSON.stringify(users, null, 2), (err) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({ code: 500, message: "Internal Server Error" });
                        } else {
                            console.log(`Name updated for user with UUID ${UUID}`);
                            res.status(200).json({ code: 200, message: "Name updated" });
                        }
                    });
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