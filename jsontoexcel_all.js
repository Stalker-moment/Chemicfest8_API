const excel = require('excel4node');
const fs = require('fs');

// Baca data dari file JSON
const jsonData = JSON.parse(fs.readFileSync('./db/maindata.json', 'utf8'));

// Objek untuk menampung data berdasarkan peran
let rolesData = {};

// Mengelompokkan data berdasarkan peran
jsonData.forEach(entry => {
  const role = entry.Role;
  if (!rolesData[role]) {
    rolesData[role] = [];
  }
  // Hapus kolom "Password"
  delete entry.Password;
  // Ubah data nested object menjadi string
  entry.Verified = JSON.stringify(entry.Verified);
  entry.Attachment = JSON.stringify(entry.Attachment);
  entry.PartOf = JSON.stringify(entry.PartOf);
  entry.Details = JSON.stringify(entry.Details);
  rolesData[role].push(entry);
});

// Buat file Excel
const wb = new excel.Workbook();

// Iterasi melalui setiap peran dan tambahkan sebagai sheet baru
for (let role in rolesData) {
  const data = rolesData[role];
  const ws = wb.addWorksheet(role);
  const header = Object.keys(data[0]);
  // Tulis header
  header.forEach((heading, index) => {
    ws.cell(1, index + 1).string(heading);
  });
  // Tulis data
  data.forEach((row, rowIndex) => {
    header.forEach((heading, index) => {
      const value = row[heading];
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          ws.cell(rowIndex + 2, index + 1).string(JSON.stringify(value));
        } else {
          ws.cell(rowIndex + 2, index + 1).string(value.toString());
        }
      } else {
        ws.cell(rowIndex + 2, index + 1).string('');
      }
    });
  });
}

// Simpan file Excel
wb.write('data.xlsx', (err, stats) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('File Excel berhasil disimpan!');
});
