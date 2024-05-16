const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const maindatabase = './db/maindata.json';
const configdb = './db/config.json';
const siswahalfdb = './db/Siswa_Half.json';
const siswahalf2db = './db/Siswa_Half_2.json';
const configdata = JSON.parse(fs.readFileSync(configdb, "utf8"));

// Definisikan opsi CORS
if(configdata.cors === true){
    const whitelist = configdata.allowOrigin;
    var corsOptions = {
        origin: function (origin, callback) {
            if (whitelist.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        optionsSuccessStatus: 200
    };
} else {
    var corsOptions = {
        origin: false,
        optionsSuccessStatus: 200
    };
}

router.get("/get/alluser", cors(corsOptions), (req, res) => {
    fs.readFile(maindatabase, "utf8", (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).json({ code: 500, message: "Internal Server Error" });
            return;
        } else {
            const users = JSON.parse(data);

            //delete the password from the response
            users.forEach((user) => {
                delete user.Password;
                delete user.Attachment;
                delete user.Session;
                delete user.Main_Session;
            });

            const formattedJson = JSON.stringify(users, null, 2);

            // Mengirimkan JSON langsung sebagai respons HTTP
            res.setHeader('Content-Type', 'application/json');

            // Mengirimkan JSON jika permintaan diizinkan oleh CORS
            res.send(formattedJson);
        }
    });
});

router.get("/get/mod/alluser", (req, res) => {
    fs.readFile(maindatabase, "utf8", (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).json({ code: 500, message: "Internal Server Error" });
            return;
        } else {
            const users = JSON.parse(data);
            //delete the password from the response
            users.forEach((user) => {
                delete user.Password;
            });
            const formattedJson = JSON.stringify(users, null, 2);

            // Mengirimkan JSON langsung sebagai respons HTTP
            res.setHeader('Content-Type', 'application/json');
            res.send(formattedJson);
        }
    });
});

router.get("/get/manual/user/:type", (req, res) => {
    const type = req.params.type;

    const readData = fs.readFileSync(maindatabase, "utf8");

    if(type === "false"){
        //memfilter data yang memiliki data Verified.Method === "MANUAL" && Verified.Email === false && Verified.Phone === false
        const users = JSON.parse(readData).filter((user) => user.Verified.Method === "MANUAL" && user.Verified.Email === false && user.Verified.Phone === false);
        const formattedJson = JSON.stringify(users, null, 2);
        res.setHeader("Content-Type", "application/json");
        res.send(formattedJson);
        return;
    } else if(type === "true"){
        //memfilter data yang memiliki data Verified.Method === "MANUAL" && Verified.Email === true && Verified.Phone === true
        const users = JSON.parse(readData).filter((user) => user.Verified.Method === "MANUAL" && user.Verified.Email === true && user.Verified.Phone === true);
        const formattedJson = JSON.stringify(users, null, 2);
        res.setHeader("Content-Type", "application/json");
        res.send(formattedJson);
        return;
    } else if(type === "all"){
        //memfilter data yang memiliki data Verified.Method === "MANUAL"
        const users = JSON.parse(readData).filter((user) => user.Verified.Method === "MANUAL");
        const formattedJson = JSON.stringify(users, null, 2);
        res.setHeader("Content-Type", "application/json");
        res.send(formattedJson);
        return;
    } else {
        res.status(404).json({ code: 404, message: "Not Found" });
        return;
    }
});

// Middleware untuk menangani penolakan CORS
router.use((err, req, res, next) => {
    if (err) {
        res.status(500).json({ code: 500, error: err.message });
    } else {
        next();
    }
});

router.get("/get/allsiswa", cors(corsOptions), (req, res) => {
    fs.readFile(siswahalfdb, "utf8", (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).json({ code: 500, message: "Internal Server Error" });
            return;
        } else {
            const users = JSON.parse(data);

            const formattedJson = JSON.stringify(users, null, 2);

            // Mengirimkan JSON langsung sebagai respons HTTP
            res.setHeader('Content-Type', 'application/json');

            // Mengirimkan JSON jika permintaan diizinkan oleh CORS
            res.send(formattedJson);
        }
    });
});

router.get("/get/allsiswa2", (req, res) => {
    fs.readFile(siswahalf2db, "utf8", (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).json({ code: 500, message: "Internal Server Error" });
            return;
        } else {
            const users = JSON.parse(data);

            const formattedJson = JSON.stringify(users, null, 2);

            // Mengirimkan JSON langsung sebagai respons HTTP
            res.setHeader('Content-Type', 'application/json');

            // Mengirimkan JSON jika permintaan diizinkan oleh CORS
            res.send(formattedJson);
        }
    });
});

module.exports = router;