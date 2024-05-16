const fs = require('fs');
const path = require('path');

const jsoninput = './input.json';
const jsongood = './good.json';
const jsonbad = './bad.json';

const input = JSON.parse(fs.readFileSync(jsoninput, 'utf8'));

async function filterData() {
    const good = [];
    const bad = [];

    for (let i = 0; i < input.length; i++) {
        if (input[i].Email === undefined) {
            bad.push(input[i]);
        } else {
            // Formatting nomor telepon
            let formattedPhone = input[i].Phone.replace(/[^\d]/g, ''); // Hapus karakter non-digit
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '62' + formattedPhone.slice(1); // Ubah format '08...' menjadi '628...'
            }
            if (!formattedPhone.startsWith('62')) {
                formattedPhone = '62' + formattedPhone; // Tambahkan '62' di depan jika tidak ada
            }

            input[i].Phone = formattedPhone;
            good.push(input[i]);
        }
    }

    if (!fs.existsSync(jsongood)) {
        fs.writeFileSync(jsongood, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(jsonbad)) {
        fs.writeFileSync(jsonbad, JSON.stringify([], null, 2));
    }

    fs.writeFileSync(jsongood, JSON.stringify(good, null, 2));
    fs.writeFileSync(jsonbad, JSON.stringify(bad, null, 2));
    //result the total of good and bad data
    console.log(`Total data: ${input.length}`);
    console.log(`Good data: ${good.length}`);
    console.log(`Bad data: ${bad.length}`);
    console.log(`Good data saved to ${path.resolve(jsongood)}`);
    console.log(`Bad data saved to ${path.resolve(jsonbad)}`);
}

filterData();
