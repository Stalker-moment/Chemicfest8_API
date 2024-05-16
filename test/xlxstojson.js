const xlsx = require('xlsx');
const fs = require('fs');

// Membaca file Excel
const workbook = xlsx.readFile('siswa1213.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Fungsi untuk mendapatkan nilai dari sel
function getCellValue(cell) {
    return cell ? cell.v : '';
}

// Array untuk menyimpan data
const dataArray = [];

// Looping dari baris 2 hingga 409
for (let i = 2; i <= 409; i++) {
    const data = {
        "NIS": parseInt(getCellValue(sheet['E' + i])),
        "Nama": getCellValue(sheet['F' + i]),
        "Kelas": getCellValue(sheet['B' + i]) + ' ' + getCellValue(sheet['C' + i]) + ' ' + getCellValue(sheet['D' + i]),
        "Gender": getCellValue(sheet['G' + i])
    };
    dataArray.push(data);
}

// Membuat struktur JSON sesuai dengan kebutuhan
const jsonData = {
    data: dataArray
};

// Menyimpan data ke file JSON
fs.writeFile('siswa1213.json', JSON.stringify(jsonData, null, 2), (err) => {
    if (err) {
        console.error('Error writing JSON to file:', err);
    } else {
        console.log('Data has been successfully converted to JSON and saved as siswa1213.json');
    }
});
