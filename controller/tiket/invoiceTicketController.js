const chalk = require("chalk");
const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const puppeteer = require('puppeteer');

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

const ticketdb = "./db/ticket_storage.json";
const maindb = "./db/maindata.json";

async function convertHtmlToPdf(htmlContent, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set HTML content to the page
  await page.setContent(htmlContent);
  
  // Ensure that the page has fully loaded
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds (adjust time as needed)

  // Convert the page to PDF
  await page.pdf({ path: outputPath, format: 'letter' });
  console.log(chalk.cyan(dateformat()), chalk.green(`[PUPPETEER]`), chalk.cyan(`PDF has been created: ${outputPath}`));
  
  await browser.close();
}


router.get("/invoice/ticket", (req, res) => {
  res.status(404).render("invoicenofound");
});

router.get("/dl/invoice/ticket", (req, res) => {
  res.status(404).render("invoicenofound");
});

router.get("/invoice/ticket/:id", async(req, res) => {
  const ticketId = req.params.id;
  const ticketdbData = JSON.parse(fs.readFileSync(ticketdb, "utf8"));
  const pathpdf = './file/ticket/invoice';

  if (!ticketId) {
    res.status(404).render("invoicenofound");
    return;
  }

  try {
    // Ambil 20 digit pertama dari ticketId
    const ticketIdPrefix = ticketId.substring(0, 20);

    // Temukan data tiket berdasarkan UUID
    const ticketData = ticketdbData.find(
      (ticket) => ticket.UUID === parseInt(ticketIdPrefix)
    );

    //menemukan user di database utama
    const maindbData = JSON.parse(fs.readFileSync(maindb, "utf8"));
    const userData = maindbData.find((user) => user.UUID === ticketData.UUID);

    if (ticketData) {
      // Cari ticketCode dalam setiap transaksi
      let foundTicket;
      let indexTransaction;
      ticketData.Transaction.forEach((transaction) => {
        if (transaction.Ticket.TicketCode === ticketId) {
          foundTicket = transaction.Ticket;
          indexTransaction = ticketData.Transaction.indexOf(transaction);
        }
      });

      const paymentTransaction =
        ticketData.Transaction[indexTransaction].Payment;

      if (!paymentTransaction) {
        res.status(404).render("invoicenofound");
        return;
      }

      if(paymentTransaction.Status !== "on success") {
        var statusPayment = "BELUM LUNAS";
      } else {
        var statusPayment = "LUNAS";
      }

      const typeuser = userData.Role.toUpperCase();
      const typeticket = foundTicket.ProductId.toString();

      //pick 4 last digit of phone number
      const unixuser = userData.Phone.toString().slice(-4);

      //pick 4 early digit of UUID
      const unix2user = userData.UUID.toString().slice(0, 4);

      const unixinvoice = unixuser + unix2user;

      //parse timestamp ISO to format : 17 Agustus 1945
      const date = new Date(paymentTransaction.Time);
      const options = { year: "numeric", month: "long", day: "numeric" };
      const formattedDate = date.toLocaleDateString("id-ID", options);

      //format ammont to IDR
      const amount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(paymentTransaction.Amount);

      if (foundTicket) {
        const htmlori = `<!DOCTYPE html>
        <html lang="en">
        
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Invoice Chemicfest#8</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    white: "#f1f5f9",
                    "white-1": "#cbd5e1",
                    dark: "#1e2124",
                    "dark-1": "#282b30",
                  },
                  fontFamily: {
                    signika: ["Signika", "sans-serif"],
                  },
                },
              },
            };
          </script>
          <style type="text/tailwindcss">
            @font-face {
                font-family: "Signika";
                src: url("/fonts/Signika-VariableFont_GRAD,wght.ttf");
              }
        
              body {
                @apply max-w-[1000px] mx-auto;
              }
        
              @media print {
                body {
                  margin: 0;
                }
        
                .no-print {
                  display: none;
                }
        
                /* Enable background graphics */
                html {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
        
                /* Disable headers and footers */
                @page {
                  size: auto;
                  margin: 0;
                }
              }
            </style>
        </head>
        
        <body class="font-signika h-[100vh] pt-10">
          <div class="flex flex-col justify-between h-full">
            <div class="flex flex-col p-5">
              <!--Header-->
              <div class="flex gap-2 justify-between">
                <div class="w-1/2 my-auto">
                  <img src="https://chemicfest.site/file/assets/osis.png" class="w-16 sm:w-28" alt="">
                </div>
                <div class="flex flex-col text-right w-1/2 my-auto">
                  <h1 class="text-base sm:text-2xl font-semibold">INVOICE</h1>
                  <h1 class="text-sm sm:text-lg text-[#FC664E]">INV/${unixuser}/${unix2user}/TKT/${typeticket}</h1>
                </div>
              </div>
          
              <div class="flex justify-between gap-5">
                <div class="flex flex-col w-1/2 my-auto mt-10 gap-1">
                  <h1 class="text-base sm:text-xl font-bold">DITERBITKAN OLEH</h1>
                  <h1 class="sm:text-lg font-semibold text-sm">Chemicfest#8 | OSIS Chemicalistronic</h1>
                  <h1 class="text-sm sm:text-base font-normal">Jl. Kusumanegara No.3, Yogyakarta 55166</h1>
                  <h1 class="text-sm sm:text-base font-normal">noreply@chemicfest.com</h1>
                </div>
                <div class="flex flex-col w-1/2 my-auto mt-10 gap-1">
                  <h1 class="text-base sm:text-xl font-bold">UNTUK</h1>
                  <div class="flex flex-row gap-3 w-full">
                    <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Kode Pesanan</p>
                    <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">CF8-${typeticket}-${unixinvoice}</p>
                  </div>
                  <div class="flex flex-row gap-3 w-full">
                    <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Nama Pemesan</p>
                    <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">${ticketData.Name}</p>
                  </div>
                  <div class="flex flex-row gap-3 w-full">
                    <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Tanggal Pembelian</p>
                    <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">${formattedDate}</p>
                  </div>
                </div>
              </div>
          
              <table class="table-auto w-full mt-10 gap-2">
                <thead class="border-t-2 border-b-2 text-left text-sm">
                  <tr>
                    <th>PRODUK</th>
                    <th>JUMLAH</th>
                    <th>HARGA SATUAN</th>
                    <th>TOTAL HARGA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ticket Chemicfest#8 ${typeuser}</td>
                    <td>1</td>
                    <td>${amount}</td>
                    <td class="text-[#FC664E] font-semibold">${amount}</td>
                  </tr>
                  </tr>
                </tbody>
              </table>
            </div>  
        
            <div class="flex flex-col sm:flex-row gap-3 bg-[#F2F2E8] p-10 sm:p-16 justify-between rounded-t-3xl">
              <div class="flex flex-col">
                <h1 class="text-md sm:text-xl">TOTAL</h1>
                <h1 class="text-xl sm:text-3xl font-semibold text-[#FC664E]">${amount}</h1>
              </div>
              <div class="flex flex-col">
                <h1 class="text-md sm:text-xl">METODE PEMBAYARAN</h1>
                <h1 class="text-xl sm:text-3xl font-semibold">${paymentTransaction.Method}</h1>
              </div>
              <div class="flex flex-col">
                <h1 class="text-md sm:text-xl">STATUS</h1>
                <h1 class="text-xl sm:text-3xl font-semibold">${statusPayment}</h1>
              </div>
            </div>
        
          </div>
        </body>
        
        </html>`

        //check pdf on directory
  const pdfname = `invoice_${ticketId}.pdf`;
  const pdfpath = path.join(pathpdf, pdfname);
    
  const checkpdf = fs.existsSync(pdfpath);
  if(checkpdf){
    //do nothing
  } else {
    await convertHtmlToPdf(htmlori, pdfpath);
  }

  const html = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice Chemicfest#8</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              white: "#f1f5f9",
              "white-1": "#cbd5e1",
              dark: "#1e2124",
              "dark-1": "#282b30",
            },
            fontFamily: {
              signika: ["Signika", "sans-serif"],
            },
          },
        },
      };
    </script>
    <style type="text/tailwindcss">
      @font-face {
          font-family: "Signika";
          src: url("/fonts/Signika-VariableFont_GRAD,wght.ttf");
        }
  
        body {
          @apply max-w-[1000px] mx-auto;
          margin-top: 0; /* Menghilangkan gap atas pada body */
      }
  
        @media print {
          body {
            margin: 0;
          }
  
          .no-print {
            display: none;
          }
  
          /* Enable background graphics */
          html {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
  
          /* Disable headers and footers */
          @page {
            size: auto;
            margin: 0;
          }
        }

        .button-container {
          background-color: #F2F2E8;
          width: 100%; /* Memastikan elemen meluas secara penuh (full-width) */
          display: flex;
          justify-content: center;
          margin-top: 0; /* Menghilangkan gap atas */
      }
      
      .download-button {
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 14px;
        margin-top: 20px;
        margin-bottom: 20px;
        margin-right: 3px;
        background-color: #ffe500;
        color: #000;
        padding: 8px 8px;
        border-radius: 5px;
        margin-left: auto; /* Mengatur margin kiri menjadi otomatis untuk menempatkan tombol di sisi kanan */
        margin-right: 5%; /* Menghapus margin kanan */
        transition: background-color 0.3s, color 0.3s;
        width: fit-content; /* Menyesuaikan lebar tombol dengan konten */
      }
      
      .download-button .iconify-icon {
          margin-right: 5px;
      }
      
      .download-button:hover {
          background-color: #000;
          color: #fff;
      }
      
      .dark-background {
          background-color: #000;
      }
      
      
      </style>
  </head>
  
  <body class="font-signika h-[100vh]">
  <div class="button-container">
    <a id="downloadLink" class="download-button" onclick="return downloadFile()">
        <iconify-icon data-icon="feather:download" class="text-lg"></iconify-icon>
        <span>Unduh Invoice</span>
    </a>
</div>
    <div class="flex flex-col justify-between h-full">
      <div class="flex flex-col p-5">
        <!--Header-->

        <div class="flex gap-2 justify-between">
          <div class="w-1/2 my-auto">
            <img src="https://chemicfest.site/file/assets/osis.png" class="w-16 sm:w-28" alt="">
          </div>
          <div class="flex flex-col text-right w-1/2 my-auto">
            <h1 class="text-base sm:text-2xl font-semibold">INVOICE</h1>
            <h1 class="text-sm sm:text-lg text-[#FC664E]">INV/${unixuser}/${unix2user}/TKT/${typeticket}</h1>
          </div>
        </div>
    
        <div class="flex justify-between gap-5">
          <div class="flex flex-col w-1/2 my-auto mt-10 gap-1">
            <h1 class="text-base sm:text-xl font-bold">DITERBITKAN OLEH</h1>
            <h1 class="sm:text-lg font-semibold text-sm">Chemicfest#8 | OSIS Chemicalistronic</h1>
            <h1 class="text-sm sm:text-base font-normal">Jl. Kusumanegara No.3, Yogyakarta 55166</h1>
            <h1 class="text-sm sm:text-base font-normal">noreply@chemicfest.com</h1>
          </div>
          <div class="flex flex-col w-1/2 my-auto mt-10 gap-1">
            <h1 class="text-base sm:text-xl font-bold">UNTUK</h1>
            <div class="flex flex-row gap-3 w-full">
              <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Kode Pesanan</p>
              <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">CF8-${typeticket}-${unixinvoice}</p>
            </div>
            <div class="flex flex-row gap-3 w-full">
              <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Nama Pemesan</p>
              <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">${ticketData.Name}</p>
            </div>
            <div class="flex flex-row gap-3 w-full">
              <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Tanggal Pembelian</p>
              <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">${formattedDate}</p>
            </div>
          </div>
        </div>
    
        <table class="table-auto w-full mt-10 gap-2">
          <thead class="border-t-2 border-b-2 text-left text-sm">
            <tr>
              <th>PRODUK</th>
              <th>JUMLAH</th>
              <th>HARGA SATUAN</th>
              <th>TOTAL HARGA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ticket Chemicfest#8 ${typeuser}</td>
              <td>1</td>
              <td>${amount}</td>
              <td class="text-[#FC664E] font-semibold">${amount}</td>
            </tr>
            </tr>
          </tbody>
        </table>
      </div>  
  
      <div class="flex flex-col sm:flex-row gap-3 bg-[#F2F2E8] p-10 sm:p-16 justify-between rounded-t-3xl">
        <div class="flex flex-col">
          <h1 class="text-md sm:text-xl">TOTAL</h1>
          <h1 class="text-xl sm:text-3xl font-semibold text-[#FC664E]">${amount}</h1>
        </div>
        <div class="flex flex-col">
          <h1 class="text-md sm:text-xl">METODE PEMBAYARAN</h1>
          <h1 class="text-xl sm:text-3xl font-semibold">${paymentTransaction.Method}</h1>
        </div>
        <div class="flex flex-col">
          <h1 class="text-md sm:text-xl">STATUS</h1>
          <h1 class="text-xl sm:text-3xl font-semibold">${statusPayment}</h1>
        </div>
      </div>
  
  <script>
      function downloadFile() {
          var downloadLink = document.getElementById('downloadLink');
          downloadLink.setAttribute('href', 'https://chemicfest.site/dl/invoice/ticket/${ticketId}');
          return true; // Mengembalikan nilai true untuk melanjutkan tautan
      }
  </script>
    </div>
  </body>
  
  </html>`
  res.status(200).send(html);
      } else {
        res.status(404).render("invoicenofound");
      }
    } else {
      res.status(404).render("invoicenofound");
    }
  } catch (error) {
    res.status(404).render("invoicenofound");
  }
});

router.get("/dl/invoice/ticket/:id", async(req, res) => {
  const ticketId = req.params.id;
  const ticketdbData = JSON.parse(fs.readFileSync(ticketdb, "utf8"));
  const pathpdf = './file/ticket/invoice';

  if (!ticketId) {
    res.status(404).render("invoicenofound");
    return;
  }

  try {
    // Ambil 20 digit pertama dari ticketId
    const ticketIdPrefix = ticketId.substring(0, 20);

    // Temukan data tiket berdasarkan UUID
    const ticketData = ticketdbData.find(
      (ticket) => ticket.UUID === parseInt(ticketIdPrefix)
    );

    //menemukan user di database utama
    const maindbData = JSON.parse(fs.readFileSync(maindb, "utf8"));
    const userData = maindbData.find((user) => user.UUID === ticketData.UUID);

    if (ticketData) {
      // Cari ticketCode dalam setiap transaksi
      let foundTicket;
      let indexTransaction;
      ticketData.Transaction.forEach((transaction) => {
        if (transaction.Ticket.TicketCode === ticketId) {
          foundTicket = transaction.Ticket;
          indexTransaction = ticketData.Transaction.indexOf(transaction);
        }
      });

      const paymentTransaction =
        ticketData.Transaction[indexTransaction].Payment;

      if (!paymentTransaction) {
        res.status(404).render("invoicenofound");
        return;
      }

      if(paymentTransaction.Status !== "on success") {
        var statusPayment = "BELUM LUNAS";
      } else {
        var statusPayment = "LUNAS";
      }

      const typeuser = userData.Role.toUpperCase();
      const typeticket = foundTicket.ProductId.toString();

      //pick 4 last digit of phone number
      const unixuser = userData.Phone.toString().slice(-4);

      //pick 4 early digit of UUID
      const unix2user = userData.UUID.toString().slice(0, 4);

      const unixinvoice = unixuser + unix2user;

      //parse timestamp ISO to format : 17 Agustus 1945
      const date = new Date(paymentTransaction.Time);
      const options = { year: "numeric", month: "long", day: "numeric" };
      const formattedDate = date.toLocaleDateString("id-ID", options);

      //format ammont to IDR
      const amount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(paymentTransaction.Amount);

      if (foundTicket) {

  const html = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice Chemicfest#8</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              white: "#f1f5f9",
              "white-1": "#cbd5e1",
              dark: "#1e2124",
              "dark-1": "#282b30",
            },
            fontFamily: {
              signika: ["Signika", "sans-serif"],
            },
          },
        },
      };
    </script>
    <style type="text/tailwindcss">
      @font-face {
          font-family: "Signika";
          src: url("/fonts/Signika-VariableFont_GRAD,wght.ttf");
        }
  
        body {
          @apply max-w-[1000px] mx-auto;
        }
  
        @media print {
          body {
            margin: 0;
          }
  
          .no-print {
            display: none;
          }
  
          /* Enable background graphics */
          html {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
  
          /* Disable headers and footers */
          @page {
            size: auto;
            margin: 0;
          }
        }
      </style>
  </head>
  
  <body class="font-signika h-[100vh] pt-10">
    <div class="flex flex-col justify-between h-full">
      <div class="flex flex-col p-5">
        <!--Header-->
        <div class="flex gap-2 justify-between">
          <div class="w-1/2 my-auto">
            <img src="https://chemicfest.site/file/assets/osis.png" class="w-16 sm:w-28" alt="">
          </div>
          <div class="flex flex-col text-right w-1/2 my-auto">
            <h1 class="text-base sm:text-2xl font-semibold">INVOICE</h1>
            <h1 class="text-sm sm:text-lg text-[#FC664E]">INV/${unixuser}/${unix2user}/TKT/${typeticket}</h1>
          </div>
        </div>
    
        <div class="flex justify-between gap-5">
          <div class="flex flex-col w-1/2 my-auto mt-10 gap-1">
            <h1 class="text-base sm:text-xl font-bold">DITERBITKAN OLEH</h1>
            <h1 class="sm:text-lg font-semibold text-sm">Chemicfest#8 | OSIS Chemicalistronic</h1>
            <h1 class="text-sm sm:text-base font-normal">Jl. Kusumanegara No.3, Yogyakarta 55166</h1>
            <h1 class="text-sm sm:text-base font-normal">noreply@chemicfest.com</h1>
          </div>
          <div class="flex flex-col w-1/2 my-auto mt-10 gap-1">
            <h1 class="text-base sm:text-xl font-bold">UNTUK</h1>
            <div class="flex flex-row gap-3 w-full">
              <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Kode Pesanan</p>
              <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">CF8-${typeticket}-${unixinvoice}</p>
            </div>
            <div class="flex flex-row gap-3 w-full">
              <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Nama Pemesan</p>
              <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">${ticketData.Name}</p>
            </div>
            <div class="flex flex-row gap-3 w-full">
              <p class="text-sm sm:text-base my-auto text-dark w-1/3 font-normal">Tanggal Pembelian</p>
              <p class="text-sm sm:text-base my-auto text-dark w-2/3 font-semibold">${formattedDate}</p>
            </div>
          </div>
        </div>
    
        <table class="table-auto w-full mt-10 gap-2">
          <thead class="border-t-2 border-b-2 text-left text-sm">
            <tr>
              <th>PRODUK</th>
              <th>JUMLAH</th>
              <th>HARGA SATUAN</th>
              <th>TOTAL HARGA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ticket Chemicfest#8 ${typeuser}</td>
              <td>1</td>
              <td>${amount}</td>
              <td class="text-[#FC664E] font-semibold">${amount}</td>
            </tr>
            </tr>
          </tbody>
        </table>
      </div>  
  
      <div class="flex flex-col sm:flex-row gap-3 bg-[#F2F2E8] p-10 sm:p-16 justify-between rounded-t-3xl">
        <div class="flex flex-col">
          <h1 class="text-md sm:text-xl">TOTAL</h1>
          <h1 class="text-xl sm:text-3xl font-semibold text-[#FC664E]">${amount}</h1>
        </div>
        <div class="flex flex-col">
          <h1 class="text-md sm:text-xl">METODE PEMBAYARAN</h1>
          <h1 class="text-xl sm:text-3xl font-semibold">${paymentTransaction.Method}</h1>
        </div>
        <div class="flex flex-col">
          <h1 class="text-md sm:text-xl">STATUS</h1>
          <h1 class="text-xl sm:text-3xl font-semibold">${statusPayment}</h1>
        </div>
      </div>
  
    </div>
  </body>
  
  </html>`
  //check pdf on directory
  const pdfname = `invoice_${ticketId}.pdf`;
  const pdfpath = path.join(pathpdf, pdfname);
    
  const checkpdf = fs.existsSync(pdfpath);
  if(checkpdf){
    res.download(pdfpath);
    return;
  } else {
    await convertHtmlToPdf(html, pdfpath);
    res.download(pdfpath);
    return;
  }
      } else {
        res.status(404).render("invoicenofound");
      }
    } else {
      res.status(404).render("invoicenofound");
    }
  } catch (error) {
    res.status(404).render("invoicenofound");
  }
});

module.exports = router;
