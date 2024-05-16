const fs = require("fs");
const chalk = require("chalk");

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

const jsonUser = "./db/maindata.json";

async function sessionWatcher() {
    try {
        let jsonData = fs.readFileSync(jsonUser, "utf8");
        let data = JSON.parse(jsonData);

        const currentTime = new Date().getTime();

        data.forEach((user) => {
            let arraySession = user.Session;
            let arrayExpiredSession = user.Expired_Session;

            // Menggunakan reverse loop agar dapat menghapus item tanpa mempengaruhi indeks
            for (let i = arraySession.length - 1; i >= 0; i--) {
                let expirationTime = arrayExpiredSession[i];
                
                if (expirationTime <= currentTime) {
                    // Hapus session dari _Session dan Expired_Session jika telah kadaluarsa
                    console.log(chalk.cyan(dateformat()), chalk.magenta(`[SESSION]`), chalk.cyan(`Session ${arraySession[i]} expired,`), chalk.white(`removed from user ${user.Name}`));
                    arraySession.splice(i, 1);
                    arrayExpiredSession.splice(i, 1);
                    user.Now_Session -= 1;
                }
            }
        });

        fs.writeFileSync(jsonUser, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(chalk.cyan(dateformat()), error);
    }
}

module.exports = sessionWatcher;
