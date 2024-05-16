const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/map/:filename", (req, res) =>
    res.sendFile(path.resolve(`./file/map/${req.params.filename}`))
);

module.exports = router;