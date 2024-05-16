const fs = require("fs");
const axios = require("axios");

async function downloadImage(url, image_path) {
  const writer = fs.createWriteStream(image_path);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

downloadImage("https://i.ibb.co/vjkkTFT/GJm-Grlpa8-AA26um.jpg", "./downloaded_image.jpg");