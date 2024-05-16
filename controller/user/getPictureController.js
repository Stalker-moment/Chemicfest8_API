const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

router.get("/profile/:name", (req, res) => {
    const name = req.params.name;

    //if name not contain .jpg
    if(!name.includes('.jpg')){
        var names = name + '.jpg';
    } else {
        var names = name;
    }

    const filePath = `./file/profile/${names}`;
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.sendFile(path.resolve('./file/profile/default.jpg'));
    }
});

module.exports = router;