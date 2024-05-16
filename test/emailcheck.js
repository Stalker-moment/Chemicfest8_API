const emailExistence = require('email-existence');

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

// Contoh penggunaan
const email = 'sinyo5666@gmail.com';

checkEmailExistence(email)
    .then(exists => {
        if (exists) {
            console.log(`${email} terdaftar.`);
        } else {
            console.log(`${email} tidak terdaftar.`);
        }
    })
    .catch(error => {
        console.error('Terjadi kesalahan:', error);
    });
