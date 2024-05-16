const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const { constrainedMemory } = require("process");
const cors = require("cors");

const configpath = "./db/config.json";
const urlserver = `https://livenow.chemicfest.site/api/server`;

const configdata = JSON.parse(fs.readFileSync(configpath, "utf8"));

// Definisikan opsi CORS
if (configdata.cors === true) {
  const whitelist = configdata.allowOrigin;
  var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200,
  };
} else {
  var corsOptions = {
    origin: false,
    optionsSuccessStatus: 200,
  };
}

router.get("/get/storage/json/stream", cors(corsOptions), async (req, res) => {
  const config = JSON.parse(fs.readFileSync(configpath));

  const StreamConfig = config.StreamUrl;

  if (StreamConfig.isOnline == false) {
    var data = {
      code: 200,
      message: "Stream is offline",
      data: {
        isOnline: StreamConfig.isOnline,
        m3u8: StreamConfig.m3u8,
        flv: StreamConfig.flv,
        server: {},
      },
    };
  } else if (StreamConfig.isOnline == true) {
    const getDataFromServer = await axios.get(urlserver);
    const serverData = getDataFromServer.data;
    var data = {
      code: 200,
      message: "Stream is online",
      data: {
        isOnline: StreamConfig.isOnline,
        m3u8: StreamConfig.m3u8,
        flv: StreamConfig.flv,
        server: {
          clients: serverData.clients,
          os: serverData.os,
          cpu: serverData.cpu,
          ram: serverData.mem,
          net: serverData.net,
          nodejs: serverData.nodejs,
        },
      },
    };
  } else {
    var data = {
      code: 400,
      message: "Error",
      data: {
        isOnline: StreamConfig.isOnline,
        m3u8: StreamConfig.m3u8,
        flv: StreamConfig.flv,
        server: {},
      },
    };
  }

  const prettier = JSON.stringify(data, null, 2);
  res.setHeader("Content-Type", "application/json");
  res.send(prettier);
});

// Middleware untuk menangani penolakan CORS
router.use((err, req, res, next) => {
  if (err) {
    res.status(500).json({ code: 500, error: err.message });
  } else {
    next();
  }
});

module.exports = router;
