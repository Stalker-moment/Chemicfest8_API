const express = require("express");
const fs = require("fs");
const { get } = require("http");
const router = express.Router();
const axios = require("axios");
const IpPrivate = require("ip");
const performance = require("performance-now");

const config = "./db/config.json";
const readconfig = JSON.parse(fs.readFileSync(config, "utf-8"));
const { main_origin, main_domain } = readconfig.RedirectUrl;

//get public ip
const IpPublic = 'https://icanhazip.com/';

async function getIpPublic() {
  return new Promise(async(resolve, reject) => {
    try {
      const response = await axios.get(IpPublic);
      resolve(response.data.trim()); // Trim data untuk menghilangkan spasi tambahan, jika ada
    } catch (error) {
      reject(error);
    }
  });
}

router.get("/", (req, res) => {
  res.redirect(main_origin);
});

router.get("/login", (req, res) => {
  res.redirect(main_origin+"/login");
});

router.get("/api", (req, res) => {
  res.redirect(main_origin);
});

router.get("/server.rdp", async (req, res) => {
  // Dapatkan IP publik
  const getIp = await getIpPublic();
  // Buat konten file RDP
  const rdpContent = `
    full address:s:${getIp}
    prompt for credentials:i:1
    authentication level:i:2
    gatewayusagemethod:i:4
    gatewayhostname:s:
    gatewaycredentialssource:i:4
    alternate shell:s:
    shell working directory:s:
    disable wallpaper:i:1
    disable full window drag:i:1
    disable menu anims:i:1
    disable themes:i:1
  `;
  // Set header untuk memberi tahu browser bahwa ini adalah file RDP
  res.set({
    'Content-Type': 'application/rdp',
    'Content-Disposition': 'attachment; filename="server.rdp"'
  });
  // Kirim konten file RDP
  res.send(rdpContent);
});

router.get("/rdp", async (req, res) => {
  const getIp = await getIpPublic();
  res.redirect(`${getIp}:3389`);
});

router.get("/server", async (req, res) => {
  const getIp = await getIpPublic();
  //statistic of memory usage
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  const memory = used.toFixed(2);
  //statistic of ping time
  const start = performance();
  const response = await axios.get("https://www.google.com");
  const end = performance();
  const pingTime = (end - start).toFixed(2);
  //get port
  const port = 2024;
  //get local ip
  const myIpPrivate = IpPrivate.address();
  //get total file in directory
  const db = './db';
  const controller = './controller';
  const countFile = (dir) => {
    return fs.readdirSync(dir).length;
  }
  //send as json
  res.json({
    ip_public: getIp,
    ip_local: myIpPrivate,
    ip_rdp: `${getIp}:3389`,
    port: port,
    ping_time: pingTime,
    memory_usage: memory,
    total_file_db: countFile(db),
    total_file_controller: countFile(controller)
  });
});


module.exports = router;