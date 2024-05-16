const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

router.get("/gallery/:name", (req, res) => {
    const name = req.params.name;

    //if name not contain .jpg
    if(!name.includes('.jpg')){
        var names = name + '.jpg';
    } else {
        var names = name;
    }

    const filePath = `./file/gallery/${names}`;
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.sendFile(path.resolve('./file/gallery/80000.jpg'));
    }
});

module.exports = router;