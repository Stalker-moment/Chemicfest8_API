const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const configdb = './db/config.json';
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

const maindatabase = './db/gallery.json';

router.get("/get/gallery", cors(corsOptions),(req, res) => {

    fs.readFile(maindatabase, "utf8", (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).json({ code: 500, message: "Internal Server Error" });
            return;
        } else {
            const users = JSON.parse(data);
            const formattedJson = JSON.stringify(users, null, 2);

            // Mengirimkan JSON langsung sebagai respons HTTP
            res.setHeader('Content-Type', 'application/json');
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