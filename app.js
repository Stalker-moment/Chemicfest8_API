const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const performance = require('performance-now');
const chalk = require('chalk');
const app = express();
const port = 2024;
const IpPublic = 'https://icanhazip.com/';
const IpPrivate = require("ip");
const cronjob = require('node-cron');

const myIpPrivate = IpPrivate.address();

//dir path
const db = './db';
const controller = './controller';

//count file in directory
const countFile = (dir) => {
    return fs.readdirSync(dir).length;
}

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
  
  //check ping time to google
  async function checkPingMs() {
    return new Promise(async(resolve, reject) => {
      try {
        const start = performance();
        const response = await axios.get("https://www.google.com");
        const end = performance();
        const pingTime = (end - start).toFixed(2);
        resolve(pingTime);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  async function getRamUsageNode() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    return used.toFixed(2);
  }

//load function
const mainSessionWatcher = require('./function/mainSessionWatcher');
const sessionWatcher = require('./function/sessionWatcher');
const otpCodeWatcher = require('./function/otpCodeWatcher');
const forgotPassWatcher = require('./function/forgotPassWatcher');

//cronjob
cronjob.schedule('*/1 * * * *', async() => {
    await mainSessionWatcher();
    await sessionWatcher();
    await otpCodeWatcher();
    await forgotPassWatcher();
});

//load controller (redirect)
const mainredirecrtController = require('./controller/redirect/mainredirectController');

//load controller (user)
const loginController = require('./controller/user/loginController');
const registerController = require('./controller/user/registerController');
const getUserController = require('./controller/user/getUserController');
const editNameController = require('./controller/user/editNameController');
const logoutController = require('./controller/user/logoutController');
const editProfileController = require('./controller/user/editProfileController');
const getPictureController = require('./controller/user/getPictureController');
const getAllUserController = require('./controller/user/getAllUserController');
const getPricelistController = require('./controller/user/getPricelistController');
const sessionCheckController = require('./controller/user/sessionCheckController');
const watchController = require('./controller/user/watchController');
const unwatchController = require('./controller/user/unwatchController');
const getAttachmentController = require('./controller/user/getAttachmentController');
const userPostCommentController = require('./controller/user/userPostCommentController');

//load controller (validation)
const getOtpController = require('./controller/validation/getOtpController');
const giveOtpController = require('./controller/validation/giveOtpController');
const getUserOtpController = require('./controller/validation/getUserOtpController');
const verifyManualUserController = require('./controller/validation/verifyManualUserController');

//load controller (ticket)
const getBarcodeController = require('./controller/tiket/getBarcodeController');
const getQrcodeController = require('./controller/tiket/getQrcodeController');
const requestTicketController = require('./controller/tiket/requestTicketController');
const buyTicketController = require('./controller/tiket/buyTicketController');
const validateTicketController = require('./controller/tiket/validateTicketController');
const verifyPaymentTicketController = require('./controller/tiket/verifyPaymentTicket');
const invoiceTicketController = require('./controller/tiket/invoiceTicketController');
const checkHaveTicketController = require('./controller/tiket/checkHaveTicketController');
const eticketController = require('./controller/tiket/eticketController');
const checkinTicketController = require('./controller/tiket/checkinTicketController');

//load controller (internal)
const getGalleryJsonController = require('./controller/internal/getGalleryJsonController');
const getProductPictureController = require('./controller/internal/getProductPictureController');
const getGalleryPictureController = require('./controller/internal/getGalleryPictureController');
const buyProductController = require('./controller/internal/buyProductController');
const getAssetsPictureController = require('./controller/internal/getAssetsPictureController');
const getStorageJsonSiswaGuruController = require('./controller/internal/getStorageJsonSiswaGuruController');
const getStorageJsonStreamController = require('./controller/internal/getStorageJsonStreamController');
const getStorageJsonCommentController = require('./controller/internal/getStorageJsonCommentController');
const embededMapController = require('./controller/internal/embededMapController');
const requestForgotPasswordController = require('./controller/internal/requestForgotPasswordController');
const verifyForgotPasswordController = require('./controller/internal/verifyForgotPasswordController'); 
const getMapPictureController = require('./controller/internal/getMapPictureController');
const getStorageJsonCheckinController = require('./controller/internal/getStorageJsonCheckinController');
const getSponsorPictureController = require('./controller/internal/getSponsorPictureController');
const getStorageJsonSponsorController = require('./controller/internal/getStorageJsonSponsorController');
const getClearAllSessionController = require('./controller/internal/getClearAllSessionController');

//-----------------Configuration------------------//
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.enable('trust proxy');
app.set('view engine', 'ejs');

//------------------------Routes-----------------------//

//use redirect
app.use(mainredirecrtController);

//user
app.use('/api', loginController);
app.use('/api', registerController);
app.use('/api', getUserController);
app.use('/api', editNameController);
app.use('/api', logoutController);
app.use('/api', editProfileController);
app.use('/file', getPictureController);
app.use('/api', getAllUserController);
app.use('/api', getPricelistController);
app.use('/api', sessionCheckController);
app.use('/api', watchController);
app.use('/api', unwatchController);
app.use('/file', getAttachmentController);
app.use('/api', userPostCommentController);

//validation
app.use('/api', getOtpController);
app.use('/api', giveOtpController);
app.use('/api', getUserOtpController);
app.use('/api', verifyManualUserController);

//ticket
app.use('/file', getBarcodeController);
app.use('/file', getQrcodeController);
app.use('/api', requestTicketController);
app.use('/api', buyTicketController);
app.use('/api', validateTicketController);
app.use('/api', verifyPaymentTicketController);
app.use(invoiceTicketController);
app.use(eticketController);
app.use('/api', checkHaveTicketController);
app.use('/api', checkinTicketController);

//internal
app.use('/api', getGalleryJsonController);
app.use('/file', getProductPictureController);
app.use('/file', getGalleryPictureController);
app.use('/api', buyProductController);
app.use('/file', getAssetsPictureController);
app.use('/api', getStorageJsonSiswaGuruController);
app.use('/api', getStorageJsonStreamController);
app.use('/api', getStorageJsonCommentController);
app.use('/api', embededMapController);
app.use('/api', requestForgotPasswordController);
app.use('/api', verifyForgotPasswordController);
app.use('/file', getMapPictureController);
app.use('/api', getStorageJsonCheckinController);
app.use('/file', getSponsorPictureController);
app.use('/api', getStorageJsonSponsorController);
app.use('/api', getClearAllSessionController);

//------------------------Server-----------------------//
app.listen(port, async() => {
    console.log(chalk.white.cyan(`===============[CHEMICFEST#8]===============`));
    console.log(chalk.blue.bold(`❍ Port: `),chalk.blue.italic(`${port}`));
    console.log(chalk.magenta.bold(`❍ Ping: `), chalk.magenta.italic(`${await checkPingMs()} ms`));
    console.log(chalk.cyan.bold(`❍ Ram Usage: `),chalk.cyan.italic(`${await getRamUsageNode()} MB`));
    console.log(chalk.red.bold(`❍ Controller: `),chalk.red.italic(`${countFile(controller)} Js Files`));
    console.log(chalk.yellowBright.bold(`❍ Database: `),chalk.yellowBright.italic(`${countFile(db)} Json Files`));
    try {
      const publicIp = await getIpPublic();
      console.log(chalk.green.bold(`❍ Ip Public: `),chalk.green.italic(`${publicIp}`));
    } catch (error) {
      console.error(chalk.red.bold(`Error getting public IP: `),chalk.red.italic(`Error`));
    }
    console.log(chalk.yellow.bold(`❍ Ip Private: `),chalk.yellow.italic(`${myIpPrivate}`));
    console.log(chalk.white.cyan(`==========[Server is Running Now!]==========`));
});