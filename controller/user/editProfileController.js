const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");

const maindatabase = './db/maindata.json';
const profiledir = "./file/profile";
const config = "./db/config.json";

const readconfig = JSON.parse(fs.readFileSync(config, "utf8"));
const { host_local, host_production, port } = readconfig.Server;

const domain = `${host_production}/file/profile/`;

router.post("/edit/profile", (req, res) => {
    const uuid = parseInt(req.body.uuid);
    const picture = req.body.picture;

    fs.readFile(maindatabase, "utf8", (err, data) => {
        if (err) {
            console.log(err);
        } else {
            const maindata = JSON.parse(data);
            const user = maindata.find((u) => u.UUID === uuid);
            if (user) {
                const filename = user.UUID + ".jpg";
                const filepath = path.join(profiledir, filename);
                fs.writeFile(filepath, picture, "base64", (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        user.Picture = domain + filename;
                        fs.writeFile(maindatabase, JSON.stringify(maindata, null, 2), (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(`Profile picture updated for user with UUID ${uuid}`);
                                res.status(200).json({ code: 200, message: "Profile picture updated" });
                            }
                        });
                    }
                });
            } else {
                res.status(404).json({ code: 404, message: "User not found" });
            }
        }
    });
});

module.exports = router;