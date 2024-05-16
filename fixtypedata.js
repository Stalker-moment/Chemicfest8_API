const fs = require('fs');

// Path ke file JSON
const jsonPath = './db/maindata.json';

// Fungsi untuk memperbaiki tipe data Password menjadi string jika itu integer
function fixPasswordType(data) {
    // Loop melalui setiap elemen
    for (let key in data) {
        // Cek jika kunci saat ini adalah "Password"
        if (key === 'Password') {
            // Cek tipe datanya
            if (typeof data[key] === 'number') {
                // Ubah tipe data menjadi string
                data[key] = data[key].toString();
            }
        }
        // Jika nilai tersebut adalah objek, panggil fungsi rekursif untuk menangani anak-anaknya
        else if (typeof data[key] === 'object') {
            fixPasswordType(data[key]);
        }
    }
}

// Baca file JSON
fs.readFile(jsonPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Gagal membaca file:', err);
        return;
    }

    try {
        // Parsing data JSON
        let jsonData = JSON.parse(data);
        
        // Panggil fungsi untuk memperbaiki tipe data Password
        fixPasswordType(jsonData);
        
        // Tulis kembali data yang diperbarui ke file JSON
        fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 4), 'utf8', (err) => {
            if (err) {
                console.error('Gagal menulis ke file:', err);
                return;
            }
            console.log('Tipe data Password telah diperbaiki.');
        });
    } catch (error) {
        console.error('Gagal parsing data JSON:', error);
    }
});
