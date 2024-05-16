const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

//file format : png
const pathimg = './file/attachment/';

router.get("/attachment/:id/:name", (req, res) => {
    const id = req.params.id;
    const name = req.params.name;

    //if name not contain .png
    if(!name.includes('.jpg')){
        var names = name + '.jpg';
    } else {
        var names = name;
    }

    const filePath = `${pathimg}/${id}/${names}`;
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.sendFile(path.resolve(`${pathimg}nofound.jpg`));
    }
});

module.exports = router;
