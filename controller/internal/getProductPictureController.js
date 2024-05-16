const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

router.get("/product/:name", (req, res) => {
  const name = req.params.name;

  //if name not contain .jpg
  if (!name.includes(".jpg" && ".png")) {
    res.sendFile(path.resolve("./file/product/SP-000.jpg"));
  } else {
    var names = name;
  }

  const filePath = `./file/product/${names}`;
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.sendFile(path.resolve("./file/product/SP-000.jpg"));
  }
});

module.exports = router;
