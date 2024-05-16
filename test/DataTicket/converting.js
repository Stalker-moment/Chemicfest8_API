const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('./data.xlsx');
const output = [];

for (let sheetNum = 0; sheetNum <= 18; sheetNum++) {
  const sheetName = workbook.SheetNames[sheetNum];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  data.forEach((row, index) => {
    if (index === 0) {
      // Skip the header row
      return;
    }

    const NIS = row[1];
    const Name = row[2];
    const Email = row[3];
    const Phone = row[4];

    output.push({
      NIS,
      Name,
      Email,
      Phone,
      Kelas: sheetName,
    });
  });
}

fs.writeFileSync('./output.json', JSON.stringify(output, null, 2));