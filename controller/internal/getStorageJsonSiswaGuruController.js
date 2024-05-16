const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const siswa_1 = "./db/siswa_storage_1.json";
const siswa_2 = "./db/siswa_storage_2.json";
const guru = "./db/guru_storage.json";
const ticket = "./db/ticket_storage.json";
const configpath = "./db/config.json";

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

router.get("/get/storage/json/siswa/:batch/:filter/:bool", cors(corsOptions), (req, res) => {
  const batch = req.params.batch;
  const filter = req.params.filter;
  const bool = req.params.bool;

  if (batch === "1") {
    fs.readFile(siswa_1, "utf8", (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ code: 500, message: "Internal Server Error" });
        return;
      } else {
        if(filter == "true"){
          if(bool == "true"){
            //memfilter data yang memiliki data .Register === true
            const users = JSON.parse(data).filter((user) => user.Register === true);
            const formattedJson = JSON.stringify(users, null, 2);
            res.setHeader("Content-Type", "application/json");
            res.send(formattedJson);
            return;
          } else if(bool == "false"){
            //memfilter data yang memiliki data .Register === false
            const users = JSON.parse(data).filter((user) => user.Register === false);
            const formattedJson = JSON.stringify(users, null, 2);
            res.setHeader("Content-Type", "application/json");
            res.send(formattedJson);
            return;
          } else {
            res.status(404).json({ code: 404, message: "Not Found" });
            return;
          }
        } else {
        const users = JSON.parse(data);
        const formattedJson = JSON.stringify(users, null, 2);

        // Mengirimkan JSON langsung sebagai respons HTTP
        res.setHeader("Content-Type", "application/json");
        res.send(formattedJson);
        return;
        }
      }
    });
  } else if (batch === "2") {
    fs.readFile(siswa_2, "utf8", (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ code: 500, message: "Internal Server Error" });
        return;
      } else {
        if(filter == "true"){
          if(bool == "true"){
            //memfilter data yang memiliki data .Register === true
            const users = JSON.parse(data).filter((user) => user.Register === true);
            const formattedJson = JSON.stringify(users, null, 2);
            res.setHeader("Content-Type", "application/json");
            res.send(formattedJson);
            return;
          } else if(bool == "false"){
            //memfilter data yang memiliki data .Register === false
            const users = JSON.parse(data).filter((user) => user.Register === false);
            const formattedJson = JSON.stringify(users, null, 2);
            res.setHeader("Content-Type", "application/json");
            res.send(formattedJson);
            return;
          } else {
            res.status(404).json({ code: 404, message: "Not Found" });
            return;
          }
        } else {
        const users = JSON.parse(data);
        const formattedJson = JSON.stringify(users, null, 2);

        // Mengirimkan JSON langsung sebagai respons HTTP
        res.setHeader("Content-Type", "application/json");
        res.send(formattedJson);
        return;
        }
      }
    });
  } else if (batch === "all") {
    const siswa1 = fs.readFileSync(siswa_1, "utf8");
    const siswa2 = fs.readFileSync(siswa_2, "utf8");

    const users1 = JSON.parse(siswa1);
    const users2 = JSON.parse(siswa2);

    if(filter == "true"){
      if(bool == "true"){
        //memfilter data yang memiliki data .Register === true
        const users = users1.concat(users2).filter((user) => user.Register === true);
        const formattedJson = JSON.stringify(users, null, 2);
        res.setHeader("Content-Type", "application/json");
        res.send(formattedJson);
        return;
      } else if(bool == "false"){
        //memfilter data yang memiliki data .Register === false
        const users = users1.concat(users2).filter((user) => user.Register === false);
        const formattedJson = JSON.stringify(users, null, 2);
        res.setHeader("Content-Type", "application/json");
        res.send(formattedJson);
        return;
      } else {
        res.status(404).json({ code: 404, message: "Not Found" });
        return;
      }
    } else {
    const users = users1.concat(users2);
    const formattedJson = JSON.stringify(users, null, 2);

    // Mengirimkan JSON langsung sebagai respons HTTP
    res.setHeader("Content-Type", "application/json"); 
    res.send(formattedJson);
    return;
    }
  } else {
    res.status(404).json({ code: 404, message: "Not Found" });
  }
});

router.get("/get/storage/json/guru", cors(corsOptions), (req, res) => {
  fs.readFile(guru, "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
      return;
    } else {
      const users = JSON.parse(data);
      const formattedJson = JSON.stringify(users, null, 2);

      // Mengirimkan JSON langsung sebagai respons HTTP
      res.setHeader("Content-Type", "application/json");
      res.send(formattedJson);
    }
  });
});

router.get("/get/storage/json/ticket", cors(corsOptions), (req, res) => {
  fs.readFile(ticket, "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
      return;
    } else {
      const users = JSON.parse(data);
      const formattedJson = JSON.stringify(users, null, 2);

      // Mengirimkan JSON langsung sebagai respons HTTP
      res.setHeader("Content-Type", "application/json");
      res.send(formattedJson);
    }
  });
});

router.get("/get/storage/json/mod/ticket", (req, res) => {
  fs.readFile(ticket, "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
      return;
    } else {
      const users = JSON.parse(data);
      const formattedJson = JSON.stringify(users, null, 2);

      // Mengirimkan JSON langsung sebagai respons HTTP
      res.setHeader("Content-Type", "application/json");
      res.send(formattedJson);
    }
  });
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
