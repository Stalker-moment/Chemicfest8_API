const excel = require('excel4node');
const fs = require('fs');

const maindatabase = './db/maindata.json';
const ticketStorage = './db/ticket_storage.json';

// Baca data dari file JSON
const mainData = JSON.parse(fs.readFileSync(maindatabase, 'utf8'));
const ticketData = JSON.parse(fs.readFileSync(ticketStorage, 'utf8'));

// Fungsi untuk mencari transaksi yang berhasil (on success) berdasarkan UUID
const findSuccessfulTransactions = (uuid) => {
    const user = ticketData.find(user => user.UUID === uuid);
    if (!user || !user.Transaction) return [];
    const sscc = user.Transaction.filter(transaction => transaction.Payment.Status === 'on success');
    //console.log(sscc);
    return sscc;
};

// Objek untuk menyimpan jumlah transaksi berhasil per pengguna
const successfulTransactionsCount = [];

// Iterasi melalui data dalam mainData
mainData.forEach(entry => {
    const uuid = entry.UUID;
    const role = entry.Role;
    // Cari transaksi yang berhasil (on success) untuk UUID saat ini
    const transactions = findSuccessfulTransactions(uuid);
    // Simpan jumlah transaksi berhasil per pengguna
    successfulTransactionsCount.push({
        uuid: uuid,
        count: transactions.length,
        transactions: transactions.map(transaction => {
            return {
                TicketCode: transaction.Ticket.TicketCode,
                Venue: transaction.Ticket.Venue,
                Type: transaction.Ticket.Type,
                Method: transaction.Payment.Method,
                Price: transaction.Payment.Amount,
                Currency: transaction.Payment.Unit,
                Status: 'online' // Status ticket online
            };
        })
    });
});

// Buat file Excel
const wb = new excel.Workbook();

// Iterasi melalui setiap peran dan tambahkan sebagai sheet baru
for (let role of new Set(mainData.map(entry => entry.Role))) {
    const data = mainData.filter(entry => entry.Role === role);
    const ws = wb.addWorksheet(role);
    const header = Object.keys(data[0]);
    // Hapus kolom Password
    const filteredHeader = header.filter(heading => heading !== 'Password');
    // Tulis header
    filteredHeader.forEach((heading, index) => {
        ws.cell(1, index + 1).string(heading);
    });
    // Tulis data
    data.forEach((row, rowIndex) => {
        filteredHeader.forEach((heading, index) => {
            const value = row[heading];
            if (value !== undefined && value !== null) {
                if (typeof value === 'object' && heading !== 'Transactions') {
                    ws.cell(rowIndex + 2, index + 1).string(JSON.stringify(value));
                } else if (Array.isArray(value) && heading === 'Transactions') {
                    // Format data tiket
                    const tickets = value.map(ticket => {
                        return `${ticket.TicketCode}, ${ticket.Venue}, ${ticket.Type}, ${ticket.Method}, ${ticket.Status}, ${ticket.Price} ${ticket.Currency}`;
                    });
                    ws.cell(rowIndex + 2, index + 1).string(tickets.join('\n'));
                } else {
                    ws.cell(rowIndex + 2, index + 1).string(value.toString());
                }
            } else {
                ws.cell(rowIndex + 2, index + 1).string('');
            }
        });
    });
}

// Tambahkan sheet untuk menampilkan jumlah transaksi berhasil per pengguna
const wsTransactionsCount = wb.addWorksheet('Transactions Count');
// Tulis header
wsTransactionsCount.cell(1, 1).string('UUID');
wsTransactionsCount.cell(1, 2).string('Nama');
wsTransactionsCount.cell(1, 3).string('Phone');
wsTransactionsCount.cell(1, 4).string('Role');
wsTransactionsCount.cell(1, 5).string('Kelas');
wsTransactionsCount.cell(1, 6).string('Macam Ticket (Jenis Ticket & Harga)');
wsTransactionsCount.cell(1, 7).string('Successful Transactions Count');

// Tulis data jumlah transaksi berhasil per pengguna
successfulTransactionsCount.forEach((entry, index) => {
    const uuid = entry.uuid;
    const nama = mainData.find(data => data.UUID === uuid).Name;
    const phone = mainData.find(data => data.UUID === uuid).Phone;
    const role = mainData.find(data => data.UUID === uuid).Role;
    const kelas = mainData.find(data => data.UUID === uuid).Details ? mainData.find(data => data.UUID === uuid).Details.Kelas : '';
    const successfulTransactions = entry.count;

    wsTransactionsCount.cell(index + 2, 1).string(uuid.toString());
    wsTransactionsCount.cell(index + 2, 2).string(nama);
    wsTransactionsCount.cell(index + 2, 3).string(phone);
    wsTransactionsCount.cell(index + 2, 4).string(role);
    wsTransactionsCount.cell(index + 2, 5).string(kelas);
    
    // Menuliskan informasi tiket sesuai dengan jumlah successfulTransactions
    entry.transactions.forEach((ticket, rowIndex) => {
        wsTransactionsCount.cell(index + 2 + rowIndex, 6).string(`${ticket.Type}: ${ticket.Price} ${ticket.Currency}`);
    });

    wsTransactionsCount.cell(index + 2, 7).number(successfulTransactions);
});

// Simpan file Excel
wb.write('data.xlsx', (err, stats) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('File Excel berhasil disimpan!');
});
