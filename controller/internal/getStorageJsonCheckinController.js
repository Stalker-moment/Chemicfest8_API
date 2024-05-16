const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const configpath = "./db/config.json";
const checkinpath = "./db/checkin_storage.json";
const configdata = JSON.parse(fs.readFileSync(configpath, "utf8"));

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

router.get("/get/storage/json/checkin", cors(corsOptions), async (req, res) => {
    try{
        const checkinData = JSON.parse(fs.readFileSync(checkinpath, "utf8"));
        const prettierresult = JSON.stringify(checkinData, null, 2);
        res.setHeader("Content-Type", "application/json");
        res.send(prettierresult);
    }catch(err){
        res.status(500).send("Internal Server Error");
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

module.exports = router;