const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

router.get("/sponsor/:name", (req, res) => {
  const name = req.params.name;

  const filePath = `./file/sponsor/${name}`;
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.sendFile(path.resolve("./file/sponsor/0000.jpg"));
  }
});

module.exports = router;
