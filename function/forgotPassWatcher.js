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

const jsonUser = "./db/forgot_password.json";

async function forgotPassWatcher() {
    try {
        let jsonData = fs.readFileSync(jsonUser, "utf8");
        let data = JSON.parse(jsonData);

        const currentTime = new Date().getTime();

        data.forEach((user) => {
            //get boolean OnForgot, if true then check the time
            //if the time is more than time now then set OnForgot to false, delete token, & time set to null
            if (user.OnForgot) {
                if (currentTime > user.Expired_ms) {
                    user.OnForgot = false;
                    user.Token = "";
                    user.Time = null;
                    console.log(
                        chalk.cyan(dateformat()), 
                        chalk.red(
                            `User ${user.Username} has been removed from forgot password list`
                        )
                    );
                }
            } 
        });

        fs.writeFileSync(jsonUser, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(chalk.cyan(dateformat()), error);
    }
}

module.exports = forgotPassWatcher;
