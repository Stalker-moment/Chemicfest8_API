const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const uuid = require("uuid");
const axios = require("axios");
const chalk = require("chalk");

const maindatabase = "./db/maindata.json";

router.post("/session/main/check", (req, res) => {
  const { sessionid, users } = req.body;

  if (!sessionid) {
    return res.status(400).json({ message: "Session ID is required" });
  }

  if (!users) {
    return res.status(400).json({ message: "Users are required" });
  }

  const maindata = JSON.parse(fs.readFileSync(maindatabase, "utf-8"));

  //detect method
  if (users.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    var method = "Email";
  } else if (users.match(/^[0-9]+$/) && users.length > 9) {
    var method = "Phone";
  } else {
    var method = "Username";
  }

  const user = maindata.find((user) => user[method] === users);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  //find session in array user
  const session = user.Main_Session.find((s) => s === sessionid);

  //delete password from user before send to client
  delete user.Password;

  if (!session) {
    return res
      .status(400)
      .json({ message: "Session not found", result: false, data: user });
  }

  res.status(200).json({ message: "Session found", result: true, data: user });
});

router.post("/session/watch/check", (req, res) => {
  const { sessionid, users } = req.body;

  if (!sessionid) {
    return res.status(400).json({ message: "Session ID is required" });
  }

  if (!users) {
    return res.status(400).json({ message: "Users are required" });
  }

  const maindata = JSON.parse(fs.readFileSync(maindatabase, "utf-8"));

  //detect method
  if (users.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    var method = "Email";
  } else if (users.match(/^[0-9]+$/) && users.length > 9) {
    var method = "Phone";
  } else {
    var method = "Username";
  }

  const user = maindata.find((user) => user[method] === users);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  //find session in array user
  const session = user.Session.find((s) => s === sessionid);

  //delete password from user before send to client
  delete user.Password;

  if (!session) {
    return res
      .status(400)
      .json({ message: "Watch Session not found", result: false, data: user });
  }

  res
    .status(200)
    .json({ message: "Watch Session found", result: true, data: user });
});

module.exports = router;
