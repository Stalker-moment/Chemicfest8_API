const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

//file format : png
const pathimg = './file/ticket/barcode/';

router.get("/ticket/barcode/:name", (req, res) => {
    const name = req.params.name;

    //if name not contain .png
    if(!name.includes('.png')){
        var names = name + '.png';
    } else {
        var names = name;
    }

    const filePath = `${pathimg}${names}`;
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.sendFile(path.resolve(`${pathimg}no_found.png`));
    }
});

module.exports = router;
