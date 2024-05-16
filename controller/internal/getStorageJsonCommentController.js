const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const configpath = "./db/config.json";
const commentpath = "./db/comment.json";
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

router.get("/get/storage/json/comment", cors(corsOptions), async (req, res) => {
    try{
        const comment = JSON.parse(fs.readFileSync(commentpath));
        const prettier = JSON.stringify(comment, null, 2);
        res.setHeader("Content-Type", "application/json");
        res.send(prettier);
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