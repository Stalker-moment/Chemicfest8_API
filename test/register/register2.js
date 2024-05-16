const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const chalk = require("chalk");

const maindata = "./db/maindata.json";
const otpstore = "./db/otp_storage.json";
const config = "./db/config.json";

//database siswa & guru
const datasiswa = "./db/siswa_storage_2.json";
const dataguru = "./db/guru_storage.json";

const readconfig = JSON.parse(fs.readFileSync(config, "utf-8"));
const domain = readconfig.Server.host_production;

function twentyrandomintegers() {
  let result = "";
  const characters = "1234567890";
  const charactersLength = characters.length;
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
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
    console.log(chalk.red(`[WA VALIDATOR]`), chalk.white(`Error: ${error}`));
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
      role !== "keluargaguru"
    ) {
      return res.status(422).json({ code: 422, message: "Invalid role" });
    }

    //jika role siswa & guru
    if(role === "siswa") {
      if (!name || !username || !email || !phone || !password) {
        return res
          .status(422)
          .json({ code: 422, message: "Please fill all the fields" });
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
      let siswaname = datasis.find((user) => user.Nama === part_name);

      if(!siswaname) {
        return res
          .status(420)
          .json({ code: 420, message: "Invalid name" });
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

      //write data to database
      const rawjson = {
        UUID: parseInt(twentyrandomintegers()),
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
          ID: "-",
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
        Picture: `https://${domain}/file/profile/default.jpg`,
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
        UUID: parseInt(twentyrandomintegers()),
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
      console.log(
        chalk.green(`[REGISTER]`),
        chalk.blue(`${username}`),
        chalk.white(`Registered successfully`),
        chalk.inverse(`UUID: ${rawjson.UUID}`),
        chalk.white(`.`)
      );
      res
        .status(200)
        .json({ code: 200, message: "Register successful", data: rawjson });
  //==============================================[END OF SISWA]=======================================================//
} else if(role === "guru") {
  if (!name || !username || !email || !phone || !password) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields" });
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

  //write data to database
  const rawjson = {
    UUID: parseInt(twentyrandomintegers()),
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
      ID: "-",
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
    Picture: `https://${domain}/file/profile/default.jpg`,
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
    UUID: parseInt(twentyrandomintegers()),
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
  console.log(
    chalk.green(`[REGISTER]`),
    chalk.blue(`${username}`),
    chalk.white(`Registered successfully`),
    chalk.inverse(`UUID: ${rawjson.UUID}`),
    chalk.white(`.`)
  );
  res
    .status(200)
    .json({ code: 200, message: "Register successful", data: rawjson });
    //==============================================[END OF GURU]=======================================================//
} else if(role === "alumni") {
  if (!name || !username || !email || !phone || !password || !image_1 || !type_image_1 || !image_2 || !type_image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields" });
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

  if(type_image_2.toString() == "3"){
    var typeImage2 = "Ijazah";
  } else {
    return res
      .status(435)
      .json({ code: 435, message: "Invalid type of image 2" });
  }

  //create folder named UUID in file/attachment

  const folder = `./file/attachment/${twentyrandomintegers()}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  //download image 1 & 2
  const image1 = `${folder}/${twentyrandomintegers()}_${typeImage1}.jpg`;
  const image2 = `${folder}/${twentyrandomintegers()}_${typeImage2}.jpg`;

  await downloadImage(image_1, image1);
  await downloadImage(image_2, image2);

  //write data to database
  const rawjson = {
    UUID: parseInt(twentyrandomintegers()),
    Status: "Deactive", //Deactive, Active, Banned
    Verified: {
      Method: "MANUAL",
      Email: false,
      Phone: false,
    },
    Attachment: {
      Type_Image_1: typeImage1,
      Image_1: `https://${domain}/${image1}`,
      Type_Image_2: typeImage2,
      Image_2: `https://${domain}/${image2}`,
    },
    Part_Of: {
      Role: "-",
      Kelas: "-",
      Name: "-",
      ID: "-",
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
    Picture: `https://${domain}/file/profile/default.jpg`,
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
    UUID: parseInt(twentyrandomintegers()),
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
  console.log(
    chalk.green(`[REGISTER]`),
    chalk.blue(`${username}`),
    chalk.white(`Registered successfully`),
    chalk.inverse(`UUID: ${rawjson.UUID}`),
    chalk.white(`.`)
  );
  res
    .status(200)
    .json({ code: 200, message: "Register successful", data: rawjson });
    //==============================================[END OF ALUMNI]=======================================================//
} else if(role === "keluargasiswa") {
  if (!name || !username || !email || !phone || !password || !part_name || !image_1 || !type_image_1 || !image_2 || !type_image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields" });
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

  //find name in database
  let siswaname = datasis.find((user) => user.Nama === part_name);

  if(!siswaname) {
    return res
      .status(420)
      .json({ code: 420, message: "Invalid siswa name" });
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

  //cek type of image
  if(type_image_1.toString() == "1"){
    var typeImage1 = "KTP";
  } else {
    return res
      .status(434)
      .json({ code: 434, message: "Invalid type of image 1" });
  }

  if(type_image_2.toString() == "4"){
    var typeImage2 = "KK";
  } else {
    return res
      .status(435)
      .json({ code: 435, message: "Invalid type of image 2" });
  }

  //create folder named UUID in file/attachment

  const folder = `./file/attachment/${twentyrandomintegers()}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  //download image 1 & 2
  const image1 = `${folder}/${twentyrandomintegers()}_${typeImage1}.jpg`;
  const image2 = `${folder}/${twentyrandomintegers()}_${typeImage2}.jpg`;

  await downloadImage(image_1, image1);
  await downloadImage(image_2, image2);

  //write data to database
  const rawjson = {
    UUID: parseInt(twentyrandomintegers()),
    Status: "Deactive", //Deactive, Active, Banned
    Verified: {
      Method: "MANUAL",
      Email: false,
      Phone: false,
    },
    Attachment: {
      Type_Image_1: typeImage1,
      Image_1: `https://${domain}/${image1}`,
      Type_Image_2: typeImage2,
      Image_2: `https://${domain}/${image2}`,
    },
    Part_Of: {
      Role: "siswa",
      Kelas: siswaname.Kelas,
      Name: part_name,
      ID: siswaname.NIS,
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
    Picture: `https://${domain}/file/profile/default.jpg`,
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
    UUID: parseInt(twentyrandomintegers()),
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
  console.log(
    chalk.green(`[REGISTER]`),
    chalk.blue(`${username}`),
    chalk.white(`Registered successfully`),
    chalk.inverse(`UUID: ${rawjson.UUID}`),
    chalk.white(`.`)
  );
  res
    .status(200)
    .json({ code: 200, message: "Register successful", data: rawjson });
} else if(role === "keluargaguru") {
  if (!name || !username || !email || !phone || !password || !part_name || !image_1 || !type_image_1 || !image_2 || !type_image_2) {
    return res
      .status(422)
      .json({ code: 422, message: "Please fill all the fields" });
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

  //cek type of image
  if(type_image_1.toString() == "1"){
    var typeImage1 = "KTP";
  } else {
    return res
      .status(434)
      .json({ code: 434, message: "Invalid type of image 1" });
  }

  if(type_image_2.toString() == "4"){
    var typeImage2 = "KK";
  } else {
    return res
      .status(435)
      .json({ code: 435, message: "Invalid type of image 2" });
  }

  //create folder named UUID in file/attachment

  const folder = `./file/attachment/${twentyrandomintegers()}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  //download image 1 & 2
  const image1 = `${folder}/${twentyrandomintegers()}_${typeImage1}.jpg`;
  const image2 = `${folder}/${twentyrandomintegers()}_${typeImage2}.jpg`;

  await downloadImage(image_1, image1);
  await downloadImage(image_2, image2);

  //write data to database
  const rawjson = {
    UUID: parseInt(twentyrandomintegers()),
    Status: "Deactive", //Deactive, Active, Banned
    Verified: {
      Method: "MANUAL",
      Email: false,
      Phone: false,
    },
    Attachment: {
      Type_Image_1: typeImage1,
      Image_1: `https://${domain}/${image1}`,
      Type_Image_2: typeImage2,
      Image_2: `https://${domain}/${image2}`,
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
    Picture: `https://${domain}/file/profile/default.jpg`,
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
    UUID: parseInt(twentyrandomintegers()),
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
  console.log(
    chalk.green(`[REGISTER]`),
    chalk.blue(`${username}`),
    chalk.white(`Registered successfully`),
    chalk.inverse(`UUID: ${rawjson.UUID}`),
    chalk.white(`.`)
  );
  res
    .status(200)
    .json({ code: 200, message: "Register successful", data: rawjson });

    //==============================================[END OF KELUARGAGURU]=======================================================//
} else {
  return res.status(422).json({ code: 422, message: "Invalid role" });
}
});

module.exports = router;
