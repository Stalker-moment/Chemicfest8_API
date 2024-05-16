const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const chalk = require("chalk");
const { telepen } = require("bwip-js");
const emailExistence = require('email-existence');
const nodemailer = require("nodemailer");

//define date with format hours:minutes:seconds dd/mm/yyyy
function dateformat() {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `[${hours}:${minutes}:${seconds} ${day}/${month}/${year}]`;
}

// Fungsi untuk memeriksa keberadaan email
function checkEmailExistence(email) {
    return new Promise((resolve, reject) => {
        emailExistence.check(email, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}

const maindata = "./db/maindata.json";
const otpstore = "./db/otp_storage.json";
const config = "./db/config.json";

//database siswa & guru
const datasiswa = "./db/siswa_storage_2.json";
const datasiswa2 = "./db/siswa_storage_1.json";
const dataguru = "./db/guru_storage.json";

const readconfig = JSON.parse(fs.readFileSync(config, "utf-8"));
const domain = readconfig.Server.host_production;

async function sendWAGRUPMessage(message) {
  const api_url = readconfig.WhatsappOTP.url_api;
  const API = api_url + "sendmessagegroup";
  const idgroup = readconfig.WhatsappOTP.group_id;

  const posting = await axios.post(API, {
    number: idgroup,
    message: message,
  });

  return posting.data.status;
}

function sendEmail(email, name) {
  const gethost = JSON.parse(fs.readFileSync(config));
  const { isProduction } = gethost.EmailOTP;
  const { service, user, pass } = isProduction
    ? gethost.EmailOTP.ProductionEmail
    : gethost.EmailOTP.LocalEmail;

  const { port, secure } = gethost.EmailOTP.ProductionEmail;
  if (isProduction) {
    var transporter = nodemailer.createTransport({
      host: service,
      port: port,
      secure: secure, // true for port 465, false for other ports
      auth: {
        user: user,
        pass: pass,
      },
    });
  } else {
    var transporter = nodemailer.createTransport({
      service: service,
      auth: {
        user: user,
        pass: pass,
      },
    });
  }

  var mailOptions = {
    from: user,
    to: email,
    subject: "Chemicfest#8 Account Waiting Verified",
    html: `
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Waiting Verified</title>
  <style>
    @font-face {
      font-family: "Signika";
      src: url("https://fonts.gstatic.com/s/signika/v13/vEFU2_JTCgwQ5ejvE_oEI3A.ttf");
    }

    @font-face {
      font-family: "Montserrat";
      src: url("https://fonts.gstatic.com/s/montserrat/v15/JTURjIg1_i6t8kCHKm45_aZA3gTD_u50.woff2");
    }

    body {
      margin: 0;
      padding: 0;
      font-family: "Signika", sans-serif;
      max-width: 1000px;
      margin: auto;
    }

    .container {
      padding-top: 12px;
      padding-bottom: 6px;
    }

    .logo {
      width: 20%;
      display: block;
      margin: 0 auto;
    }

    .message {
      text-align: center;
      margin-top: 6px;
      margin-bottom: 12px;
    }

    .message p {
      font-size: 20px;
      color: #333;
    }

    .login-btn {
      background-color: #FC664E;
      color: #fff;
      padding: 10px 20px;
      border-radius: 5px;
      text-decoration: none;
      display: inline-block;
      margin-top: 12px;
    }

    .footer {
      text-align: center;
      padding-bottom: 6px;
      font-family: "Montserrat", sans-serif;
      font-size: 14px;
      color: #777;
    }

    h1 {
      text-align: center;
    }
  </style>
</head>

<body>
  <div class="container">
    <h1 class="text-3xl text-center text-gray-800">In Verification Queue</h1>
    <img class="logo" src="https://chemicfest.site/file/assets/waiting-verify.png" alt="">
    <div class="message">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for registering Chemicfest#8.</p>
        <p>Please wait a moment while our team validates your account.</p>
        <p>We will notify you shortly.</p>
    </div>
    <div class="footer">
        <p><a href="https://chemicfest.com" style="color: black; font-weight: bold; text-decoration: none;">Chemicfest#8</a> | Managed by <a href="https://instagram.com/chemicevents" style="color: black; font-weight: bold; text-decoration: none;">OSIS SMK SMTI YOGYAKARTA</a></p>
    </div>
  </div>
</body>

</html>
        `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(chalk.cyan(dateformat()), error);
      return "error";
    } else {
      console.log(chalk.cyan(dateformat()), "Email sent: " + info.response + " to " + email + "Action : Waiting Verified");
      return info.response;
    }
  });
}

function twentyrandomintegers() {
  let result = "";
  const characters = "1234567890";
  const charactersLength = characters.length;
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  //check if front number is 0
  if (result.startsWith("0")) {
    result = result.replace("0", "1");
  }

  return result;
}

async function Wa_Validator(nomornya) {
  try {
    const get_data = await axios.get(
      `https://wapi.tierkun.my.id/api/v1/checknumber/${nomornya}`
    );

    if (!get_data.data.result) {
      return "error";
    }

    if (get_data.data.result === "true") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(chalk.cyan(dateformat()), chalk.red(`[WA VALIDATOR]`), chalk.white(`Error: ${error}`));
    return "error";
  }
}

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

router.post("/register", async (req, res) => {
    const { name, username, email, phone, password, repassword, role, part_name, image_1, type_image_1, image_2, type_image_2 } = req.body;

    if (
      role !== "admin" &&
      role !== "siswa" &&
      role !== "guru" &&
      role !== "alumni" &&
      role !== "keluargasiswa" &&
      role !== "keluargaguru" &&
      role !== "public"
    ) {
      return res.status(422).json({ code: 422, message: "Invalid role" });
    }

    //jika role siswa & guru
    if(role === "siswa") {
      //hanya nama, username, email, phone, password, repassword, dan role yang diisi
      if(!name) {
        return res
          .status(422)
          .json({ code: 422, message: "Please fill all the fields, need parameter (name)" });
      }

      if (!username) {
        return res
          .status(422)
          .json({ code: 422, message: "Please fill all the fields, need parameter (username)" });
      }

      if (!email) {
        return res
          .status(422)
          .json({ code: 422, message: "Please fill all the fields, need parameter (email)" });
      } 

      if (!phone) {
        return res
          .status(422)
          .json({ code: 422, message: "Please fill all the fields, need parameter (phone)" });
      }

      if (!password) {
        return res
          .status(422)
          .json({ code: 422, message: "Please fill all the fields, need parameter (password)" });
      }

      if (!repassword) {
        return res
          .status(422)
          .json({ code: 422, message: "Please fill all the fields, need parameter (repassword)" });
      }

      if (!role) {
        return res
          .status(422)
          .json({ code: 422, message: "Please fill all the fields, need parameter (role)" });
      }

      //cek ketersediaan username dan email di database
      let data = fs.readFileSync(maindata);
      data = JSON.parse(data);

      //cek data kosong
      if (!data || !Array.isArray(data)) {
        data = [];
      }

      //format nomor WA
      let nomor = phone;
      if (nomor.startsWith("0")) {
        nomor = nomor.replace("0", "62");
      } else if (nomor.startsWith("+")) {
        nomor = nomor.replace("+", "");
      } else if (nomor.startsWith("62")) {
        nomor = nomor;
      } else {
        nomor = "62" + nomor;
      }

      let user = data.find((user) => user.Username === username);
      let mail = data.find((user) => user.Email === email);
      let phonecheck = data.find((user) => user.Phone === nomor);

      let datasis = fs.readFileSync(datasiswa);
      datasis = JSON.parse(datasis);

      //find name in database
      let siswaname = datasis.find((user) => user.Nama === name);

      if(!siswaname) {
        return res
          .status(420)
          .json({ code: 420, message: "Nama siswa tidak terdaftar" });
      }

      if(siswaname.Register === true) {
        return res
          .status(421)
          .json({ code: 421, message: "Name already registered" });
      }

      if (user) {
        return res
          .status(423)
          .json({ code: 423, message: "Username already exists" });
      }

      if (mail) {
        return res
          .status(424)
          .json({ code: 424, message: "Email already exists" });
      }

      if (phonecheck) {
        return res
          .status(425)
          .json({ code: 425, message: "Phone number already exists" });
      }

      //cek panjang password dan kelenngkapan karakter
      if (password.length < 8) {
        return res
          .status(426)
          .json({ code: 426, message: "Password must be at least 8 characters" });
      }

      if (!password.match(/[a-z]/g)) {
        return res.status(427).json({
          code: 427,
          message: "Password must contain at least one lowercase letter",
        });
      }

      if (!password.match(/[A-Z]/g)) {
        return res.status(428).json({
          code: 428,
          message: "Password must contain at least one uppercase letter",
        });
      }

      if (!password.match(/[0-9]/g)) {
        return res.status(429).json({
          code: 429,
          message: "Password must contain at least one number",
        });
      }

      if (password !== repassword) {
        return res
          .status(433)
          .json({ code: 430, message: "Password not match" });
      }

      //cek email
      if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
        return res
          .status(430)
          .json({ code: 430, message: "Invalid email address" });
      }

      const wa = await Wa_Validator(nomor);
      if (wa === false) {
        return res
          .status(431)
          .json({
            code: 431,
            message: "Invalid phone number (must be WA number)",
          });
      }

      if (wa === "error") {
        return res
          .status(432)
          .json({
            code: 432,
            message: "Invalid phone number (must be WA number)",
          });
      }

      //email existence
      // const emailcheck = await checkEmailExistence(email);
      // if(emailcheck === false) {
      //   return res
      //     .status(438)
      //     .json({ code: 438, message: "Invalid email address" });
      // }

      //write data to database
      //create folder named UUID in file/attachment
  const needID = twentyrandomintegers();
      const rawjson = {
        UUID: parseInt(needID),
        Status: "Deactive", //Deactive, Active, Banned
        Verified: {
          Method: "OTP",
          Email: false,
          Phone: false,
        },
        Attachment: {
          Type_Image_1: "-",
          Image_1: "-",
          Type_Image_2: "-",
          Image_2: "-",
        },
        Part_Of: {
          Role: "-",
          Kelas: "-",
          Name: "-",
          ID: 0,
        },
        Created_At: new Date(),
        Name: siswaname.Nama,
        Details: {
          ID: siswaname.NIS,
          TypeID: "NIS",
          Kelas: siswaname.Kelas,
          Gender: siswaname.Gender,
          Address: "",
        },
        Username: username,
        Password: password,
        Email: email,
        Phone: nomor,
        Role: role,
        Picture: `${domain}/file/profile/default.jpg`,
        Max_Session: 0,
        Now_Session: 0,
        Max_Main_Session: 1,
        Now_Main_Session: 0,
        Main_Session: [],
        Expired_Main_Session: [],
        Session: [],
        Expired_Session: [],
      };

      const rawjsonotp = {
        UUID: parseInt(needID),
        Name: name,
        Email: email,
        Phone: nomor,
        Verified: {
          Email: false,
          Phone: false,
        },
        Otp: [],
        Created_At: new Date(),
      };

      data.push(rawjson);
      fs.writeFileSync(maindata, JSON.stringify(data, null, 2));

      let otpdata = fs.readFileSync(otpstore);
      otpdata = JSON.parse(otpdata);

      if (!otpdata || !Array.isArray(otpdata)) {
        otpdata = [];
      }

      otpdata.push(rawjsonotp);
      fs.writeFileSync(otpstore, JSON.stringify(otpdata, null, 2));

      siswaname.Register = true;
      fs.writeFileSync(datasiswa, JSON.stringify(datasis, null, 2));

      const message = `
📝 *New Register*

👤 *Name*: ${name}
🔑 *Username*: ${username}
📱 *Phone*: wa.me/${nomor}
📧 *Email*: ${email}
🔗 *Role*: ${role}
✅ *Verification*: OTP

*Details*
📚 *NIS*: ${siswaname.NIS}
🏫 *Kelas*: ${siswaname.Kelas}

📅 *Date*: ${new Date()}`;

      sendWAGRUPMessage(message);
      console.log(
        chalk.cyan(dateformat()),
        chalk.green(`[REGISTER]`),
        chalk.blue(`${username}`),
        chalk.white(`Registered successfully`),
        chalk.inverse(`UUID: ${rawjson.UUID}`),
        chalk.white(`.`)
      );
      res
        .status(200)
        .json({ code: 200, message: "Register successful", canOtp: true, data: rawjson });
  //==============================================[END OF SISWA]=======================================================//
} else if(role === "guru") {
  //hanya nama, username, email, phone, password, repassword, dan role yang diisi
  if(!name) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (name)" });
  }

  if (!username) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (username)" });
  }

  if (!email) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (email)" });
  } 

  if (!phone) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (phone)" });
  }

  if (!password) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (password)" });
  }

  if (!repassword) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (repassword)" });
  }

  if (!role) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (role)" });
  }

  //cek ketersediaan username dan email di database
  let data = fs.readFileSync(maindata);
  data = JSON.parse(data);

  //cek data kosong
  if (!data || !Array.isArray(data)) {
    data = [];
  }

  //format nomor WA
  let nomor = phone;
  if (nomor.startsWith("0")) {
    nomor = nomor.replace("0", "62");
  } else if (nomor.startsWith("+")) {
    nomor = nomor.replace("+", "");
  } else if (nomor.startsWith("62")) {
    nomor = nomor;
  } else {
    nomor = "62" + nomor;
  }

  let user = data.find((user) => user.Username === username);
  let mail = data.find((user) => user.Email === email);
  let phonecheck = data.find((user) => user.Phone === nomor);

  //check guru database
  let datagur = fs.readFileSync(dataguru);
  datagur = JSON.parse(datagur);

  //find name in database
  let guruname = datagur.find((user) => user.Nama === name);

  if(!guruname) {
    return res
      .status(420)
      .json({ code: 420, message: "Invalid name" });
  }

  if(guruname.Register === true) {
    return res
      .status(421)
      .json({ code: 421, message: "Name already registered" });
  }

  if (user) {
    return res
      .status(423)
      .json({ code: 423, message: "Username already exists" });
  }

  if (mail) {
    return res
      .status(424)
      .json({ code: 424, message: "Email already exists" });
  }

  if (phonecheck) {
    return res
      .status(425)
      .json({ code: 425, message: "Phone number already exists" });
  }

  //cek panjang password dan kelenngkapan karakter
  if (password.length < 8) {
    return res
      .status(426)
      .json({ code: 426, message: "Password must be at least 8 characters" });
  }

  if (!password.match(/[a-z]/g)) {
    return res.status(427).json({
      code: 427,
      message: "Password must contain at least one lowercase letter",
    });
  }

  if (!password.match(/[A-Z]/g)) {
    return res.status(428).json({
      code: 428,
      message: "Password must contain at least one uppercase letter",
    });
  }

  if (!password.match(/[0-9]/g)) {
    return res.status(429).json({
      code: 429,
      message: "Password must contain at least one number",
    });
  }

  if (password !== repassword) {
    return res
      .status(433)
      .json({ code: 430, message: "Password not match" });
  }

  //cek email
  if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    return res
      .status(430)
      .json({ code: 430, message: "Invalid email address" });
  }

  const wa = await Wa_Validator(nomor);
  if (wa === false) {
    return res
      .status(431)
      .json({
        code: 431,
        message: "Invalid phone number (must be WA number)",
      });
  }

  if (wa === "error") {
    return res
      .status(432)
      .json({
        code: 432,
        message: "Invalid phone number (must be WA number)",
      });
  }

  //email existence
  // const emailcheck = await checkEmailExistence(email);
  // if(emailcheck === false) {
  //   return res
  //     .status(438)
  //     .json({ code: 438, message: "Invalid email address" });
  // }
//create folder named UUID in file/attachment
const needID = twentyrandomintegers();
  //write data to database
  const rawjson = {
    UUID: parseInt(needID),
    Status: "Deactive", //Deactive, Active, Banned
    Verified: {
      Method: "OTP",
      Email: false,
      Phone: false,
    },
    Attachment: {
      Type_Image_1: "-",
      Image_1: "-",
      Type_Image_2: "-",
      Image_2: "-",
    },
    Part_Of: {
      Role: "-",
      Kelas: "-",
      Name: "-",
      ID: 0,
    },
    Created_At: new Date(),
    Name: name,
    Details: {
      ID: guruname.NIP,
      TypeID: "NIP",
      Kelas: guruname.Kelas,
      Gender: guruname.Gender,
      Address: "",
    },
    Username: username,
    Password: password,
    Email: email,
    Phone: nomor,
    Role: role,
    Picture: `${domain}/file/profile/default.jpg`,
    Max_Session: 0,
    Now_Session: 0,
    Max_Main_Session: 1,
    Now_Main_Session: 0,
    Main_Session: [],
    Expired_Main_Session: [],
    Session: [],
    Expired_Session: [],
  };

  const rawjsonotp = {
    UUID: parseInt(needID),
    Name: name,
    Email: email,
    Phone: nomor,
    Verified: {
      Email: false,
      Phone: false,
    },
    Otp: [],
    Created_At: new Date(),
  };

  data.push(rawjson);
  fs.writeFileSync(maindata, JSON.stringify(data, null, 2));

  let otpdata = fs.readFileSync(otpstore);
  otpdata = JSON.parse(otpdata);

  if (!otpdata || !Array.isArray(otpdata)) {
    otpdata = [];
  }

  otpdata.push(rawjsonotp);
  fs.writeFileSync(otpstore, JSON.stringify(otpdata, null, 2));

  guruname.Register = true;
  fs.writeFileSync(dataguru, JSON.stringify(datagur, null, 2));

  const message = `
📝 *New Register*

👤 *Name*: ${name}
🔑 *Username*: ${username}
📱 *Phone*: wa.me/${nomor}
📧 *Email*: ${email}
🔗 *Role*: ${role}
✅ *Verification*: OTP

📅 *Date*: ${new Date()}`;
  
    sendWAGRUPMessage(message);
  console.log(
    chalk.cyan(dateformat()),
    chalk.green(`[REGISTER]`),
    chalk.blue(`${username}`),
    chalk.white(`Registered successfully`),
    chalk.inverse(`UUID: ${rawjson.UUID}`),
    chalk.white(`.`)
  );
  res
    .status(200)
    .json({ code: 200, message: "Register successful", canOtp: true, data: rawjson });
    //==============================================[END OF GURU]=======================================================//
} else if(role === "alumni") {
  //hanya nama, username, email, phone, password, repassword, type_image_1, image_1, type_image_2, image_2 dan role yang diisi
  if(!name) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (name)" });
  }

  if (!username) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (username)" });
  }

  if (!email) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (email)" });
  } 

  if (!phone) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (phone)" });
  }

  if (!password) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (password)" });
  }

  if (!repassword) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (repassword)" });
  }

  if (!type_image_1) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (type_image_1)" });
  }

  if (!image_1) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (image_1)" });
  }

  if (!type_image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (type_image_2)" });
  }

  if (!image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (image_2)" });
  }

  if (!role) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (role)" });
  }

  //cek ketersediaan username dan email di database
  let data = fs.readFileSync(maindata);
  data = JSON.parse(data);

  //cek data kosong
  if (!data || !Array.isArray(data)) {
    data = [];
  }

  //format nomor WA
  let nomor = phone;
  if (nomor.startsWith("0")) {
    nomor = nomor.replace("0", "62");
  } else if (nomor.startsWith("+")) {
    nomor = nomor.replace("+", "");
  } else if (nomor.startsWith("62")) {
    nomor = nomor;
  } else {
    nomor = "62" + nomor;
  }

  let user = data.find((user) => user.Username === username);
  let mail = data.find((user) => user.Email === email);
  let phonecheck = data.find((user) => user.Phone === nomor);

  if (user) {
    return res
      .status(423)
      .json({ code: 423, message: "Username already exists" });
  }

  if (mail) {
    return res
      .status(424)
      .json({ code: 424, message: "Email already exists" });
  }

  if (phonecheck) {
    return res
      .status(425)
      .json({ code: 425, message: "Phone number already exists" });
  }

  //cek panjang password dan kelenngkapan karakter
  if (password.length < 8) {
    return res
      .status(426)
      .json({ code: 426, message: "Password must be at least 8 characters" });
  }

  if (!password.match(/[a-z]/g)) {
    return res.status(427).json({
      code: 427,
      message: "Password must contain at least one lowercase letter",
    });
  }

  if (!password.match(/[A-Z]/g)) {
    return res.status(428).json({
      code: 428,
      message: "Password must contain at least one uppercase letter",
    });
  }

  if (!password.match(/[0-9]/g)) {
    return res.status(429).json({
      code: 429,
      message: "Password must contain at least one number",
    });
  }

  if (password !== repassword) {
    return res
      .status(433)
      .json({ code: 430, message: "Password not match" });
  }

  //cek email
  if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    return res
      .status(430)
      .json({ code: 430, message: "Invalid email address" });
  }

  const wa = await Wa_Validator(nomor);
  if (wa === false) {
    return res
      .status(431)
      .json({
        code: 431,
        message: "Invalid phone number (must be WA number)",
      });
  }

  if (wa === "error") {
    return res
      .status(432)
      .json({
        code: 432,
        message: "Invalid phone number (must be WA number)",
      });
  }

  //email existence
  // const emailcheck = await checkEmailExistence(email);
  // if(emailcheck === false) {
  //   return res
  //     .status(438)
  //     .json({ code: 438, message: "Invalid email address" });
  // }

  //cek type of image
  if(type_image_1.toString() == "1"){
    var typeImage1 = "KTP";
  } else if(type_image_1.toString() == "2"){
    var typeImage1 = "Kartu Pelajar";
  } else {
    return res
      .status(434)
      .json({ code: 434, message: "Invalid type of image 1" });
  }

  if(type_image_2.toString() == "4"){
    var typeImage2 = "Ijazah";
  } else {
    return res
      .status(435)
      .json({ code: 435, message: "Invalid type of image 2" });
  }

  //create folder named UUID in file/attachment

  const needID = twentyrandomintegers();
  const folder = `./file/attachment/${needID}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  //download image 1 & 2
  const image1 = `${folder}/${needID}_${typeImage1}.jpg`;
  const image2 = `${folder}/${needID}_${typeImage2}.jpg`;
  const domainimage1 = `${domain}/file/attachment/${needID}/${needID}_${typeImage1}.jpg`;
  const domainimage2 = `${domain}/file/attachment/${needID}/${needID}_${typeImage2}.jpg`;

  const downloadimage1 = await downloadImage(image_1, image1);
  const downloadimage2 = await downloadImage(image_2, image2);

  if(downloadimage1 === "error") {
    return res
      .status(436)
      .json({ code: 436, message: `Error process image ${typeImage1}` });
  }

  if(downloadimage2 === "error") {
    return res
      .status(437)
      .json({ code: 437, message: `Error process image ${typeImage2}` });
  }

  //write data to database
  const rawjson = {
    UUID: parseInt(needID),
    Status: "Deactive", //Deactive, Active, Banned
    Verified: {
      Method: "MANUAL",
      Email: false,
      Phone: false,
    },
    Attachment: {
      Type_Image_1: typeImage1,
      Image_1: domainimage1,
      Type_Image_2: typeImage2,
      Image_2: domainimage2,
    },
    Part_Of: {
      Role: "-",
      Kelas: "-",
      Name: "-",
      ID: 0,
    },
    Created_At: new Date(),
    Name: name,
    Details: {
      ID: 0,
      TypeID: "-",
      Kelas: "-",
      Gender: "-",
      Address: "-",
    },
    Username: username,
    Password: password,
    Email: email,
    Phone: nomor,
    Role: role,
    Picture: `${domain}/file/profile/default.jpg`,
    Max_Session: 0,
    Now_Session: 0,
    Max_Main_Session: 1,
    Now_Main_Session: 0,
    Main_Session: [],
    Expired_Main_Session: [],
    Session: [],
    Expired_Session: [],
  };

  const rawjsonotp = {
    UUID: parseInt(needID),
    Name: name,
    Email: email,
    Phone: nomor,
    Verified: {
      Email: false,
      Phone: false,
    },
    Otp: [],
    Created_At: new Date(),
  };

  data.push(rawjson);
  fs.writeFileSync(maindata, JSON.stringify(data, null, 2));

  let otpdata = fs.readFileSync(otpstore);
  otpdata = JSON.parse(otpdata);

  if (!otpdata || !Array.isArray(otpdata)) {
    otpdata = [];
  }

  //send email
  const mailsender = sendEmail(email, name);
  if(mailsender === "error") {
    //retry send email
    const mailsender2 = sendEmail(email, name);
    if(mailsender2 === "error") {
      console.log(chalk.cyan(dateformat()), chalk.red(`[EMAIL]`), chalk.white(`Error send email in register for ${name} (${email})`));
    }
  }
  
  otpdata.push(rawjsonotp);
  fs.writeFileSync(otpstore, JSON.stringify(otpdata, null, 2));

  const message = `
📝 *New Register*

👤 *Name*: ${name}
🔑 *Username*: ${username}
📱 *Phone*: wa.me/${nomor}
📧 *Email*: ${email}
🔗 *Role*: ${role}
❌ *Verification*: MANUAL

*ATTAHCMENT :*
📸 *${typeImage1}*: ${domainimage1}
📸 *${typeImage2}*: ${domainimage2}

📅 *Date*: ${new Date()}`;

      sendWAGRUPMessage(message);

  console.log(
    chalk.cyan(dateformat()),
    chalk.green(`[REGISTER]`),
    chalk.blue(`${username}`),
    chalk.white(`Registered successfully`),
    chalk.inverse(`UUID: ${rawjson.UUID}`),
    chalk.white(`.`)
  );
  res
    .status(200)
    .json({ code: 200, message: "Register successful", canOtp: false, data: rawjson });
    //==============================================[END OF ALUMNI]=======================================================//
} else if(role === "keluargasiswa") {
  //semua perlu diisi
  if(!name) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (name)" });
  }

  if (!username) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (username)" });
  }

  if (!email) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (email)" });
  } 

  if (!phone) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (phone)" });
  }

  if (!password) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (password)" });
  }

  if (!repassword) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (repassword)" });
  }

  if (!type_image_1) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (type_image_1)" });
  }

  if (!image_1) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (image_1)" });
  }

  if (!type_image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (type_image_2)" });
  }

  if(!image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (image_2)" });
  }

  if(!part_name){
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (part_name)" });
  }

  if (!role) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (role)" });
  }

  //cek ketersediaan username dan email di database
  let data = fs.readFileSync(maindata);
  data = JSON.parse(data);

  //cek data kosong
  if (!data || !Array.isArray(data)) {
    data = [];
  }

  //format nomor WA
  let nomor = phone;
  if (nomor.startsWith("0")) {
    nomor = nomor.replace("0", "62");
  } else if (nomor.startsWith("+")) {
    nomor = nomor.replace("+", "");
  } else if (nomor.startsWith("62")) {
    nomor = nomor;
  } else {
    nomor = "62" + nomor;
  }

  let user = data.find((user) => user.Username === username);
  let mail = data.find((user) => user.Email === email);
  let phonecheck = data.find((user) => user.Phone === nomor);

  //check siswa database
  let datasis = fs.readFileSync(datasiswa);
  datasis = JSON.parse(datasis);

  let datasis2 = fs.readFileSync(datasiswa2);
  datasis2 = JSON.parse(datasis2);

  //find name in database 1 & 2
  let siswaname = datasis.find((user) => user.Nama === part_name);
  let siswaname2 = datasis2.find((user) => user.Nama === part_name);

  //console.log(siswaname);
  //console.log(siswaname2);

  if(!siswaname && !siswaname2) {
    return res
      .status(420)
      .json({ code: 420, message: "Nama siswa tidak terdaftar" });
  }

  //define find name
  if(siswaname) {
    var findname = siswaname;
  } else {
    var findname = siswaname2;
  }

  if (user) {
    return res
      .status(423)
      .json({ code: 423, message: "Username already exists" });
  }

  if (mail) {
    return res
      .status(424)
      .json({ code: 424, message: "Email already exists" });
  }

  if (phonecheck) {
    return res
      .status(425)
      .json({ code: 425, message: "Phone number already exists" });
  }

  //cek panjang password dan kelenngkapan karakter
  if (password.length < 8) {
    return res
      .status(426)
      .json({ code: 426, message: "Password must be at least 8 characters" });
  }

  if (!password.match(/[a-z]/g)) {
    return res.status(427).json({
      code: 427,
      message: "Password must contain at least one lowercase letter",
    });
  }

  if (!password.match(/[A-Z]/g)) {
    return res.status(428).json({
      code: 428,
      message: "Password must contain at least one uppercase letter",
    });
  }

  if (!password.match(/[0-9]/g)) {
    return res.status(429).json({
      code: 429,
      message: "Password must contain at least one number",
    });
  }

  if (password !== repassword) {
    return res
      .status(433)
      .json({ code: 430, message: "Password not match" });
  }

  //cek email
  if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    return res
      .status(430)
      .json({ code: 430, message: "Invalid email address" });
  }

  const wa = await Wa_Validator(nomor);
  if (wa === false) {
    return res
      .status(431)
      .json({
        code: 431,
        message: "Invalid phone number (must be WA number)",
      });
  }

  if (wa === "error") {
    return res
      .status(432)
      .json({
        code: 432,
        message: "Invalid phone number (must be WA number)",
      });
  }

  //email existence
  // const emailcheck = await checkEmailExistence(email);
  // if(emailcheck === false) {
  //   return res
  //     .status(438)
  //     .json({ code: 438, message: "Invalid email address" });
  // }

  //cek type of image
  if(type_image_1.toString() == "1"){
    var typeImage1 = "KTP";
  } else {
    return res
      .status(434)
      .json({ code: 434, message: "Invalid type of image 1" });
  }

  if(type_image_2.toString() == "3"){
    var typeImage2 = "KK";
  } else {
    return res
      .status(435)
      .json({ code: 435, message: "Invalid type of image 2" });
  }

  //create folder named UUID in file/attachment
//create folder named UUID in file/attachment
  const needID = twentyrandomintegers();
  const folder = `./file/attachment/${needID}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  //download image 1 & 2
  const image1 = `${folder}/${needID}_${typeImage1}.jpg`;
  const image2 = `${folder}/${needID}_${typeImage2}.jpg`;
  const domainimage1 = `${domain}/file/attachment/${needID}/${needID}_${typeImage1}.jpg`;
  const domainimage2 = `${domain}/file/attachment/${needID}/${needID}_${typeImage2}.jpg`;

  const downloadimage1 = await downloadImage(image_1, image1);
  const downloadimage2 = await downloadImage(image_2, image2);

  if(downloadimage1 === "error") {
    return res
      .status(436)
      .json({ code: 436, message: `Error process image ${typeImage1}` });
  }

  if(downloadimage2 === "error") {
    return res
      .status(437)
      .json({ code: 437, message: `Error process image ${typeImage2}` });
  }

  //write data to database
  const rawjson = {
    UUID: parseInt(needID),
    Status: "Deactive", //Deactive, Active, Banned
    Verified: {
      Method: "MANUAL",
      Email: false,
      Phone: false,
    },
    Attachment: {
      Type_Image_1: typeImage1,
      Image_1: domainimage1,
      Type_Image_2: typeImage2,
      Image_2: domainimage2,
    },
    Part_Of: {
      Role: "siswa",
      Kelas: findname.Kelas,
      Name: part_name,
      ID: findname.NIS,
    },
    Created_At: new Date(),
    Name: name,
    Details: {
      ID: 0,
      TypeID: "-",
      Kelas: "-",
      Gender: "-",
      Address: "-",
    },
    Username: username,
    Password: password,
    Email: email,
    Phone: nomor,
    Role: role,
    Picture: `${domain}/file/profile/default.jpg`,
    Max_Session: 0,
    Now_Session: 0,
    Max_Main_Session: 1,
    Now_Main_Session: 0,
    Main_Session: [],
    Expired_Main_Session: [],
    Session: [],
    Expired_Session: [],
  };

  const rawjsonotp = {
    UUID: parseInt(needID),
    Name: name,
    Email: email,
    Phone: nomor,
    Verified: {
      Email: false,
      Phone: false,
    },
    Otp: [],
    Created_At: new Date(),
  };

  data.push(rawjson);
  fs.writeFileSync(maindata, JSON.stringify(data, null, 2));

  let otpdata = fs.readFileSync(otpstore);
  otpdata = JSON.parse(otpdata);

  if (!otpdata || !Array.isArray(otpdata)) {
    otpdata = [];
  }

  //send email
  const mailsender = sendEmail(email, name);
  if(mailsender === "error") {
    //retry send email
    const mailsender2 = sendEmail(email, name);
    if(mailsender2 === "error") {
      console.log(chalk.cyan(dateformat()), chalk.red(`[EMAIL]`), chalk.white(`Error send email in register for ${name} (${email})`));
    }
  }

  otpdata.push(rawjsonotp);
  fs.writeFileSync(otpstore, JSON.stringify(otpdata, null, 2));

  const message = `
📝 *New Register*

👤 *Name*: ${name}
🔑 *Username*: ${username}
📱 *Phone*: wa.me/${nomor}
📧 *Email*: ${email}
🔗 *Role*: ${role}
❌ *Verification*: MANUAL

*ATTACHMENT :*
📸 *${typeImage1}*: ${domainimage1}
📸 *${typeImage2}*: ${domainimage2}

*PART OF :*
👤 *Name*: ${part_name}
🔢 *ID*: ${findname.NIS}
🏫 *Kelas*: ${findname.Kelas}

📅 *Date*: ${new Date()}`;

      sendWAGRUPMessage(message);
  console.log(
    chalk.cyan(dateformat()),
    chalk.green(`[REGISTER]`),
    chalk.blue(`${username}`),
    chalk.white(`Registered successfully`),
    chalk.inverse(`UUID: ${rawjson.UUID}`),
    chalk.white(`.`)
  );
  res
    .status(200)
    .json({ code: 200, message: "Register successful",canOtp: false, data: rawjson });
//==============================================[END OF KELUARGA SISWA]=======================================================//
} else if(role === "keluargaguru") {
  //semua perlu diisi
  if(!name) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (name)" });
  }

  if (!username) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (username)" });
  }

  if (!email) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (email)" });
  } 

  if (!phone) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (phone)" });
  }

  if (!password) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (password)" });
  }

  if (!repassword) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (repassword)" });
  }

  if (!type_image_1) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (type_image_1)" });
  }

  if (!image_1) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (image_1)" });
  }

  if (!type_image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (type_image_2)" });
  }

  if(!image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (image_2)" });
  }

  if(!part_name){
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (part_name)" });
  }

  if (!role) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields, need parameter (role)" });
  }

  //cek ketersediaan username dan email di database
  let data = fs.readFileSync(maindata);
  data = JSON.parse(data);

  //cek data kosong
  if (!data || !Array.isArray(data)) {
    data = [];
  }

  //format nomor WA
  let nomor = phone;
  if (nomor.startsWith("0")) {
    nomor = nomor.replace("0", "62");
  } else if (nomor.startsWith("+")) {
    nomor = nomor.replace("+", "");
  } else if (nomor.startsWith("62")) {
    nomor = nomor;
  } else {
    nomor = "62" + nomor;
  }

  let user = data.find((user) => user.Username === username);
  let mail = data.find((user) => user.Email === email);
  let phonecheck = data.find((user) => user.Phone === nomor);

  //check guru database
  let datagur = fs.readFileSync(dataguru);
  datagur = JSON.parse(datagur);

  //find name in database
  let guruname = datagur.find((user) => user.Nama === part_name);

  if(!guruname) {
    return res
      .status(420)
      .json({ code: 420, message: "Invalid guru name" });
  }

  if (user) {
    return res
      .status(423)
      .json({ code: 423, message: "Username already exists" });
  }

  if (mail) {
    return res
      .status(424)
      .json({ code: 424, message: "Email already exists" });
  }

  if (phonecheck) {
    return res
      .status(425)
      .json({ code: 425, message: "Phone number already exists" });
  }

  //cek panjang password dan kelenngkapan karakter
  if (password.length < 8) {
    return res
      .status(426)
      .json({ code: 426, message: "Password must be at least 8 characters" });
  }

  if (!password.match(/[a-z]/g)) {
    return res.status(427).json({
      code: 427,
      message: "Password must contain at least one lowercase letter",
    });
  }

  if (!password.match(/[A-Z]/g)) {
    return res.status(428).json({
      code: 428,
      message: "Password must contain at least one uppercase letter",
    });
  }

  if (!password.match(/[0-9]/g)) {
    return res.status(429).json({
      code: 429,
      message: "Password must contain at least one number",
    });
  }

  if (password !== repassword) {
    return res
      .status(433)
      .json({ code: 430, message: "Password not match" });
  }

  //cek email
  if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
    return res
      .status(430)
      .json({ code: 430, message: "Invalid email address" });
  }

  const wa = await Wa_Validator(nomor);
  if (wa === false) {
    return res
      .status(431)
      .json({
        code: 431,
        message: "Invalid phone number (must be WA number)",
      });
  }

  if (wa === "error") {
    return res
      .status(432)
      .json({
        code: 432,
        message: "Invalid phone number (must be WA number)",
      });
  }

  // //email existence
  // const emailcheck = await checkEmailExistence(email);
  // if(emailcheck === false) {
  //   return res
  //     .status(438)
  //     .json({ code: 438, message: "Invalid email address" });
  // }

  //cek type of image
  if(type_image_1.toString() == "1"){
    var typeImage1 = "KTP";
  } else {
    return res
      .status(434)
      .json({ code: 434, message: "Invalid type of image 1" });
  }

  if(type_image_2.toString() == "3"){
    var typeImage2 = "KK";
  } else {
    return res
      .status(435)
      .json({ code: 435, message: "Invalid type of image 2" });
  }

  //create folder named UUID in file/attachment
  const needID = twentyrandomintegers();

  const folder = `./file/attachment/${needID}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  //download image 1 & 2
  const image1 = `${folder}/${needID}_${typeImage1}.jpg`;
  const image2 = `${folder}/${needID}_${typeImage2}.jpg`;
  const domainimage1 = `${domain}/file/attachment/${needID}/${needID}_${typeImage1}.jpg`;
  const domainimage2 = `${domain}/file/attachment/${needID}/${needID}_${typeImage2}.jpg`;

  const downloadimage1 = await downloadImage(image_1, image1);
  const downloadimage2 = await downloadImage(image_2, image2);

  if(downloadimage1 === "error") {
    return res
      .status(436)
      .json({ code: 436, message: `Error process image ${typeImage1}` });
  }

  if(downloadimage2 === "error") {
    return res
      .status(437)
      .json({ code: 437, message: `Error process image ${typeImage2}` });
  }

  //write data to database
  const rawjson = {
    UUID: parseInt(needID),
    Status: "Deactive", //Deactive, Active, Banned
    Verified: {
      Method: "MANUAL",
      Email: false,
      Phone: false,
    },
    Attachment: {
      Type_Image_1: typeImage1,
      Image_1: domainimage1,
      Type_Image_2: typeImage2,
      Image_2: domainimage2,
    },
    Part_Of: {
      Role: "guru",
      Kelas: guruname.Kelas,
      Name: part_name,
      ID: guruname.NIP,
    },
    Created_At: new Date(),
    Name: name,
    Details: {
      ID: 0,
      TypeID: "-",
      Kelas: "-",
      Gender: "-",
      Address: "-",
    },
    Username: username,
    Password: password,
    Email: email,
    Phone: nomor,
    Role: role,
    Picture: `${domain}/file/profile/default.jpg`,
    Max_Session: 0,
    Now_Session: 0,
    Max_Main_Session: 1,
    Now_Main_Session: 0,
    Main_Session: [],
    Expired_Main_Session: [],
    Session: [],
    Expired_Session: [],
  };

  const rawjsonotp = {
    UUID: parseInt(needID),
    Name: name,
    Email: email,
    Phone: nomor,
    Verified: {
      Email: false,
      Phone: false,
    },
    Otp: [],
    Created_At: new Date(),
  };

  data.push(rawjson);
  fs.writeFileSync(maindata, JSON.stringify(data, null, 2));

  let otpdata = fs.readFileSync(otpstore);
  otpdata = JSON.parse(otpdata);

  if (!otpdata || !Array.isArray(otpdata)) {
    otpdata = [];
  }

  //send email
  const mailsender = sendEmail(email, name);
  if(mailsender === "error") {
    //retry send email
    const mailsender2 = sendEmail(email, name);
    if(mailsender2 === "error") {
      console.log(chalk.cyan(dateformat()), chalk.red(`[EMAIL]`), chalk.white(`Error send email in register for ${name} (${email})`));
    }
  }

  otpdata.push(rawjsonotp);
  fs.writeFileSync(otpstore, JSON.stringify(otpdata, null, 2));

  const message = `
📝 *New Register*

👤 *Name*: ${name}
🔑 *Username*: ${username}
📱 *Phone*: wa.me/${nomor}
📧 *Email*: ${email}
🔗 *Role*: ${role}
❌ *Verification*: MANUAL

*ATTACHMENT :*
📸 *${typeImage1}*: ${domainimage1}
📸 *${typeImage2}*: ${domainimage2}

*PART OF :*
👤 *Name*: ${part_name}
🔢 *ID*: ${guruname.NIP}
🏫 *Kelas*: ${guruname.Kelas}

📅 *Date*: ${new Date()}`;

      sendWAGRUPMessage(message);
  console.log(
    chalk.cyan(dateformat()),
    chalk.green(`[REGISTER]`),
    chalk.blue(`${username}`),
    chalk.white(`Registered successfully`),
    chalk.inverse(`UUID: ${rawjson.UUID}`),
    chalk.white(`.`)
  );
  res
    .status(200)
    .json({ code: 200, message: "Register successful", canOtp: false, data: rawjson });

    //==============================================[END OF KELUARGAGURU]=======================================================//
  } else if(role === "public") {
    //hanya nama, username, email, phone, password, repassword, dan role yang diisi
    if(!name) {
      return res
        .status(422)
        .json({ code: 422, message: "Please fill all the fields, need parameter (name)" });
    }
  
    if (!username) {
      return res
        .status(422)
        .json({ code: 422, message: "Please fill all the fields, need parameter (username)" });
    }
  
    if (!email) {
      return res
        .status(422)
        .json({ code: 422, message: "Please fill all the fields, need parameter (email)" });
    } 
  
    if (!phone) {
      return res
        .status(422)
        .json({ code: 422, message: "Please fill all the fields, need parameter (phone)" });
    }
  
    if (!password) {
      return res
        .status(422)
        .json({ code: 422, message: "Please fill all the fields, need parameter (password)" });
    }
  
    if (!repassword) {
      return res
        .status(422)
        .json({ code: 422, message: "Please fill all the fields, need parameter (repassword)" });
    }
  
    if (!role) {
      return res
        .status(422)
        .json({ code: 422, message: "Please fill all the fields, need parameter (role)" });
    }
  
    //cek ketersediaan username dan email di database
    let data = fs.readFileSync(maindata);
    data = JSON.parse(data);
  
    //cek data kosong
    if (!data || !Array.isArray(data)) {
      data = [];
    }
  
    //format nomor WA
    let nomor = phone;
    if (nomor.startsWith("0")) {
      nomor = nomor.replace("0", "62");
    } else if (nomor.startsWith("+")) {
      nomor = nomor.replace("+", "");
    } else if (nomor.startsWith("62")) {
      nomor = nomor;
    } else {
      nomor = "62" + nomor;
    }
  
    let user = data.find((user) => user.Username === username);
    let mail = data.find((user) => user.Email === email);
    let phonecheck = data.find((user) => user.Phone === nomor);
  
    if (user) {
      return res
        .status(423)
        .json({ code: 423, message: "Username already exists" });
    }
  
    if (mail) {
      return res
        .status(424)
        .json({ code: 424, message: "Email already exists" });
    }
  
    if (phonecheck) {
      return res
        .status(425)
        .json({ code: 425, message: "Phone number already exists" });
    }
  
    //cek panjang password dan kelenngkapan karakter
    if (password.length < 8) {
      return res
        .status(426)
        .json({ code: 426, message: "Password must be at least 8 characters" });
    }
  
    if (!password.match(/[a-z]/g)) {
      return res.status(427).json({
        code: 427,
        message: "Password must contain at least one lowercase letter",
      });
    }
  
    if (!password.match(/[A-Z]/g)) {
      return res.status(428).json({
        code: 428,
        message: "Password must contain at least one uppercase letter",
      });
    }
  
    if (!password.match(/[0-9]/g)) {
      return res.status(429).json({
        code: 429,
        message: "Password must contain at least one number",
      });
    }
  
    if (password !== repassword) {
      return res
        .status(433)
        .json({ code: 430, message: "Password not match" });
    }
  
    //cek email
    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)) {
      return res
        .status(430)
        .json({ code: 430, message: "Invalid email address" });
    }
  
    const wa = await Wa_Validator(nomor);
    if (wa === false) {
      return res
        .status(431)
        .json({
          code: 431,
          message: "Invalid phone number (must be WA number)",
        });
    }
  
    if (wa === "error") {
      return res
        .status(432)
        .json({
          code: 432,
          message: "Invalid phone number (must be WA number)",
        });
    }
  
    // //email existence
    // const emailcheck = await checkEmailExistence(email);
    // if(emailcheck === false) {
    //   return res
    //     .status(438)
    //     .json({ code: 438, message: "Invalid email address" });
    // }
  
    //create folder named UUID in file/attachment
  
    const needID = twentyrandomintegers();
  
    //write data to database
    const rawjson = {
      UUID: parseInt(needID),
      Status: "Deactive", //Deactive, Active, Banned
      Verified: {
        Method: "OTP",
        Email: false,
        Phone: false,
      },
      Attachment: {
        Type_Image_1: "",
        Image_1: "",
        Type_Image_2: "",
        Image_2: "",
      },
      Part_Of: {
        Role: "-",
        Kelas: "-",
        Name: "-",
        ID: 0,
      },
      Created_At: new Date(),
      Name: name,
      Details: {
        ID: 0,
        TypeID: "-",
        Kelas: "-",
        Gender: "-",
        Address: "-",
      },
      Username: username,
      Password: password,
      Email: email,
      Phone: nomor,
      Role: role,
      Picture: `${domain}/file/profile/default.jpg`,
      Max_Session: 0,
      Now_Session: 0,
      Max_Main_Session: 1,
      Now_Main_Session: 0,
      Main_Session: [],
      Expired_Main_Session: [],
      Session: [],
      Expired_Session: [],
    };
  
    const rawjsonotp = {
      UUID: parseInt(needID),
      Name: name,
      Email: email,
      Phone: nomor,
      Verified: {
        Email: false,
        Phone: false,
      },
      Otp: [],
      Created_At: new Date(),
    };
  
    data.push(rawjson);
    fs.writeFileSync(maindata, JSON.stringify(data, null, 2));
  
    let otpdata = fs.readFileSync(otpstore);
    otpdata = JSON.parse(otpdata);
  
    if (!otpdata || !Array.isArray(otpdata)) {
      otpdata = [];
    }
  
    otpdata.push(rawjsonotp);
    fs.writeFileSync(otpstore, JSON.stringify(otpdata, null, 2));
  
    const message = `
📝 *New Register*

👤 *Name*: ${name}
🔑 *Username*: ${username}
📱 *Phone*: wa.me/${nomor}
📧 *Email*: ${email}
🔗 *Role*: ${role}
✅ *Verification*: OTP

📅 *Date*: ${new Date()}`;
  
        sendWAGRUPMessage(message);
  
    console.log(
      chalk.cyan(dateformat()),
      chalk.green(`[REGISTER]`),
      chalk.blue(`${username}`),
      chalk.white(`Registered successfully`),
      chalk.inverse(`UUID: ${rawjson.UUID}`),
      chalk.white(`.`)
    );
    res
      .status(200)
      .json({ code: 200, message: "Register successful", canOtp: false, data: rawjson });
  } else {
  return res.status(422).json({ code: 422, message: "Invalid role" });
}
});

module.exports = router;
