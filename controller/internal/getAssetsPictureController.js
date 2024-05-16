const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

router.get("/assets/:name", (req, res) => {
    const name = req.params.name;
    
    const filePath = `./file/assets/${name}`;
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.sendFile(path.resolve('./file/assets/nofound.jpg'));
    }
});

module.exports = router;