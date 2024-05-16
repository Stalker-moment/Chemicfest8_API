const xlsx = require('xlsx');
const fs = require('fs');

// Membaca file Excel
const workbook = xlsx.readFile('pnsptt.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Fungsi untuk membersihkan string dari spasi dan mengonversi ke integer
function cleanAndParseInt(value) {
    // Menghapus spasi dari string dan kemudian mengonversi ke integer
    return parseInt(value.replace(/\s/g, ''), 10);
}

// Fungsi untuk mendapatkan nilai dari sel
function getCellValue(cell) {
    return cell ? cell.v : '';
}

// Array untuk menyimpan data
const dataArray = [];

// Looping dari baris 6 hingga 85
for (let i = 94; i <= 113; i++) {
    const data = {
        "NIP": "",
        "Nama": getCellValue(sheet['B' + i]),
        "Kelas": "PPNPN",
        "Gender": "",
    };
    dataArray.push(data);
}

// Membuat struktur JSON sesuai dengan kebutuhan
const jsonData = {
    data: dataArray
};

// Menyimpan data ke file JSON
fs.writeFile('pnsptt.json', JSON.stringify(jsonData, null, 2), (err) => {
    if (err) {
        console.error('Error writing JSON to file:', err);
    } else {
        console.log('Data has been successfully converted to JSON and saved as pnsptt.json');
    }
});
