const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const puppeteer = require('puppeteer');
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
    console.log(chalk.green(`[PUPPETEER]`), chalk.cyan(`PDF has been created: ${outputPath}`));
    
    await browser.close();
  }
  
router.get("/eticket", (req, res) => {
  res.status(404).render("ticketnofound");
});

router.get("/eticket/:id", async(req, res) => {
  const ticketId = req.params.id;
  const ticketdbData = JSON.parse(fs.readFileSync(ticketdb, "utf8"));
  const pathpdf = './file/ticket/eticket';

  if (!ticketId) {
    res.status(404).render("ticketnofound");
    return;
  }

  try {
    // Ambil 20 digit pertama dari ticketId
    const ticketIdPrefix = ticketId.substring(0, 20);

    //console.log(ticketIdPrefix);

    // Temukan data tiket berdasarkan UUID
    const ticketData = ticketdbData.find(
      (ticket) => ticket.UUID === parseInt(ticketIdPrefix)
    );

    //console.log(ticketData);

    //menemukan user di database utama
    const maindbData = JSON.parse(fs.readFileSync(maindb, "utf8"));
    const userData = maindbData.find((user) => user.UUID === parseInt(ticketIdPrefix));

    //console.log(userData);

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
        res.status(404).render("ticketnofound");
        return;
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
        const htmlori = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Ticket Chemicfest#8</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"></script>
                <script src="https://code.iconify.design/1/1.0.7/iconify.min.js"></script>
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
                    src: url("../public/fonts/Signika-VariableFont_GRAD,wght.ttf");
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
                  margin-right: 30%;
                  margin-left: 30%;
                  transition: background-color 0.3s, color 0.3s;
              }
      
              .download-button .iconify-icon {
                  margin-right: 5px;
              }
      
              .download-button:hover {
                  background-color: #000;
                  color: #fff;
                  margin-right: 30%;
                  margin-left: 30%;
              }
                </style>
              </head>
              <body class="font-signika h-full">
                <!--Header-->
                <div class="flex bg-dark p-6" style="background-image: url(https://chemicfest.site/file/assets/pattern.png); background-size: cover;">
                  <div class="mx-2 sm:mx-10 flex w-full">
                    <img src="https://chemicfest.site/file/assets/osis.png" class="w-16 sm:w-20" alt="CF Logo">
                    <p class="ms-auto text-white">E-Ticket</p>
                  </div>
                </div>
            
                <!--Informasi Acara-->
                <div class="text-5xl font-bold mt-5 mx-5 sm:mx-20">
                  <div class="flex flex-col border-2 p-4 rounded-xl">
                    <h5 class="text-2xl">Chemicfest #8 - Paduan Jiwa Harmoni</h5>
                    <div class="flex flex-col sm:flex-row mt-4 gap-7">
                      <div class="w-full sm:w-1/3">
                        <!--Poster-->
                        <img class="w-full rounded-lg" src="https://chemicfest.site/file/assets/banner.jpg" class="w-44" alt="">
                      </div>
                      <div class="flex flex-col w-full sm:w-2/3 gap-2">
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark md:w-fit" width="28" icon="heroicons-solid:badge-check" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark  font-semibold">OSIS SMK SMTI Yogyakarta</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark md:w-fit" width="28" icon="uil:schedule" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark  font-normal">14 Mei 2024</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark  md:w-fit" width="28" icon="carbon:location-filled" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark font-normal">Auditorium RRI, Jl. Affandi No.37, Mrican, Caturtunggal</p>
                        </div>
                      </div>
                    </div>
                  </div>
            
                  <!--Informasi Pesanan-->
                  <div class="flex flex-col mt-5 gap-4">
                    <h5 class="text-xl">Informasi Pesanan</h5>
                    <div class="flex flex-col sm:flex-row gap-2">
                      <div class="flex flex-col w-full sm:w-2/3 border-2 rounded-xl p-4 gap-2">
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Kode Pesanan</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">CF8-${typeticket}-${unixinvoice}</p>
                        </div>
            
                        <!--Nama Pemesan-->
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Nama Pemesan</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">${ticketData.Name}</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Berlaku Untuk</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">1 Pax</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Validitas Ticket</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">14 Mei 2024</p>
                        </div>
                      </div>
            
                      <div class="flex flex-col w-full sm:w-1/3 border-2 rounded-xl p-4 gap-2 mx-auto text-center">
                        <p class="font-bold text-lg">${amount}</p>
                        <img src=${foundTicket.UrlTicket.Qrcode} class="w-1/2 mx-auto" alt="">
                        <p class="font-light text-sm">Dibuat pada ${formattedDate}</p>
                      </div>
                    </div>
                  </div>
            
                  <!--Syarat dan Ketentuan-->
                  <div class="flex flex-col mt-5 gap-4">
                    <h5 class="text-xl">Syarat dan Ketentuan</h5>
                    <ol class="list-decimal ml-3 leading-loose text-base font-normal">
                      <li>Dengan menyelesaikan pemesanan/pembelian, Anda dianggap setuju dengan syarat dan ketentuan yang ditentukan penyelenggara.</li>
                      <li>Masa berlaku e-tiket hanya sampai 14 Mei saat acara dimulai.</li>
                      <li>Syarat dan ketentuan dapat diubah, ditambah, dihapus, atau diperbaiki sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
                      <li>Tiket hanya berlaku untuk satu orang dan satu akun (tidak dapat dipindah tangankan).</li>
                      <li>Penyelenggara konser tidak bertanggung jawab atas pembatalan atau penundaan acara yang disebabkan oleh keadaan darurat.</li>
                      <li>Setiap pemegang tiket harus menunjukkan identitas resmi (KTP atau kartu identitas lain yang sah) untuk menukarkan tiket dan untuk memasuki acara.</li>
                      <li>Jadwal acara akan diumumkan melalui platfrom resmi <a href="https://instagram.com/chemicevents" target="_blank"><b>@chemicevents</b></a>.</li>
                      <li>Pengunjung diharapkan untuk tiba tepat waktu sesuai dengan jadwal yang telah ditentukan.</li>
                      <li>Barang-barang berbahaya atau ilegal tidak diizinkan masuk ke dalam area acara.</li>
                      <li>Pengunjung diharapkan untuk mengikuti petunjuk dan arahan dari petugas keamanan dan panitia.</li>
                      <li>Panitia tidak bertanggung jawab atas kehilangan, kerusakan, atau cedera yang dialami oleh pengunjung selama acara.</li>
                      <li>Panduan tambahan atau perubahan penting akan diumumkan melalui platform resmi Chemicfest.</li>
                      <li>Penukaran tiket dilakukan di venue dan hanya bisa digunakan 1x penukaran.</li>
                    </ol>
                  </div>
                    </div>
                </div>
              </body>
            </html>
            
            `;

            //check pdf on directory
            const pdfname = `ticket_${ticketId}.pdf`;
            const pdfpath = path.join(pathpdf, pdfname);
              
            const checkpdf = fs.existsSync(pdfpath);
            if(checkpdf){
              //do nothing
            } else {
              await convertHtmlToPdf(htmlori, pdfpath);
            }

        // send HTML
        const html = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Ticket Chemicfest#8</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"></script>
                <script src="https://code.iconify.design/1/1.0.7/iconify.min.js"></script>
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
                    src: url("../public/fonts/Signika-VariableFont_GRAD,wght.ttf");
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
                  margin-right: 30%;
                  margin-left: 30%;
                  transition: background-color 0.3s, color 0.3s;
              }
      
              .download-button .iconify-icon {
                  margin-right: 5px;
              }
      
              .download-button:hover {
                  background-color: #000;
                  color: #fff;
                  margin-right: 30%;
                  margin-left: 30%;
              }
                </style>
              </head>
              <body class="font-signika h-full">
                <!--Header-->
                <div class="flex bg-dark p-6" style="background-image: url(https://chemicfest.site/file/assets/pattern.png); background-size: cover;">
                  <div class="mx-2 sm:mx-10 flex w-full">
                    <img src="https://chemicfest.site/file/assets/osis.png" class="w-16 sm:w-20" alt="CF Logo">
                    <p class="ms-auto text-white">E-Ticket</p>
                  </div>
                </div>
            
                <!--Informasi Acara-->
                <div class="text-5xl font-bold mt-5 mx-5 sm:mx-20">
                  <div class="flex flex-col border-2 p-4 rounded-xl">
                    <h5 class="text-2xl">Chemicfest #8 - Paduan Jiwa Harmoni</h5>
                    <div class="flex flex-col sm:flex-row mt-4 gap-7">
                      <div class="w-full sm:w-1/3">
                        <!--Poster-->
                        <img class="w-full rounded-lg" src="https://chemicfest.site/file/assets/banner.jpg" class="w-44" alt="">
                      </div>
                      <div class="flex flex-col w-full sm:w-2/3 gap-2">
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark md:w-fit" width="28" icon="heroicons-solid:badge-check" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark  font-semibold">OSIS SMK SMTI Yogyakarta</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark md:w-fit" width="28" icon="uil:schedule" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark  font-normal">14 Mei 2024</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark  md:w-fit" width="28" icon="carbon:location-filled" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark font-normal">Auditorium RRI, Jl. Affandi No.37, Mrican, Caturtunggal</p>
                        </div>
                      </div>
                    </div>
                  </div>
            
                  <!--Informasi Pesanan-->
                  <div class="flex flex-col mt-5 gap-4">
                    <h5 class="text-xl">Informasi Pesanan</h5>
                    <div class="flex flex-col sm:flex-row gap-2">
                      <div class="flex flex-col w-full sm:w-2/3 border-2 rounded-xl p-4 gap-2">
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Kode Pesanan</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">CF8-${typeticket}-${unixinvoice}</p>
                        </div>
            
                        <!--Nama Pemesan-->
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Nama Pemesan</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">${ticketData.Name}</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Berlaku Untuk</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">1 Pax</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Validitas Ticket</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">14 Mei 2024</p>
                        </div>
                      </div>
            
                      <div class="flex flex-col w-full sm:w-1/3 border-2 rounded-xl p-4 gap-2 mx-auto text-center">
                        <p class="font-bold text-lg">${amount}</p>
                        <img src=${foundTicket.UrlTicket.Qrcode} class="w-1/2 mx-auto" alt="">
                        <p class="font-light text-sm">Dibuat pada ${formattedDate}</p>
                      </div>
                    </div>
                  </div>
            
                  <!--Syarat dan Ketentuan-->
                  <div class="flex flex-col mt-5 gap-4">
                    <h5 class="text-xl">Syarat dan Ketentuan</h5>
                    <ol class="list-decimal ml-3 leading-loose text-base font-normal">
                      <li>Dengan menyelesaikan pemesanan/pembelian, Anda dianggap setuju dengan syarat dan ketentuan yang ditentukan penyelenggara.</li>
                      <li>Masa berlaku e-tiket hanya sampai 14 Mei saat acara dimulai.</li>
                      <li>Syarat dan ketentuan dapat diubah, ditambah, dihapus, atau diperbaiki sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
                      <li>Tiket hanya berlaku untuk satu orang dan satu akun (tidak dapat dipindah tangankan).</li>
                      <li>Penyelenggara konser tidak bertanggung jawab atas pembatalan atau penundaan acara yang disebabkan oleh keadaan darurat.</li>
                      <li>Setiap pemegang tiket harus menunjukkan identitas resmi (KTP atau kartu identitas lain yang sah) untuk menukarkan tiket dan untuk memasuki acara.</li>
                      <li>Jadwal acara akan diumumkan melalui platfrom resmi <a href="https://instagram.com/chemicevents" target="_blank"><b>@chemicevents</b></a>.</li>
                      <li>Pengunjung diharapkan untuk tiba tepat waktu sesuai dengan jadwal yang telah ditentukan.</li>
                      <li>Barang-barang berbahaya atau ilegal tidak diizinkan masuk ke dalam area acara.</li>
                      <li>Pengunjung diharapkan untuk mengikuti petunjuk dan arahan dari petugas keamanan dan panitia.</li>
                      <li>Panitia tidak bertanggung jawab atas kehilangan, kerusakan, atau cedera yang dialami oleh pengunjung selama acara.</li>
                      <li>Panduan tambahan atau perubahan penting akan diumumkan melalui platform resmi Chemicfest.</li>
                      <li>Penukaran tiket dilakukan di venue dan hanya bisa digunakan 1x penukaran.</li>
                    </ol>
                  </div>
                </div>
                <a id="downloadLink" class="download-button" onclick="return downloadFile()">
    <iconify-icon data-icon="feather:download" class="text-lg"></iconify-icon>
    <span>Unduh E-Ticket</span>
</a>

<script>
    function downloadFile() {
        var downloadLink = document.getElementById('downloadLink');
        downloadLink.setAttribute('href', 'https://chemicfest.site/dl/eticket/${ticketId}');
        return true; // Mengembalikan nilai true untuk melanjutkan tautan
    }
</script>
              </body>
            </html>
            
            `;
        res.status(200).send(html);
      } else {
        res.status(404).render("ticketnofound");
      }
    } else {
      res.status(404).render("ticketnofound");
    }
  } catch (error) {
    console.log(chalk.cyan(dateformat()), error);
    res.status(500).render("ticketnofound");
  }
});

router.get("/dl/eticket", async(req, res) => {
  res.status(404).render("ticketnofound");
});

router.get("/dl/eticket/:id", async(req, res) => {
  const ticketId = req.params.id;
  const ticketdbData = JSON.parse(fs.readFileSync(ticketdb, "utf8"));

  const pathpdf = './file/ticket/eticket';

  if (!ticketId) {
    res.status(404).render("ticketnofound");
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
        res.status(404).render("ticketnofound");
        return;
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
        // send HTML
        const html = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Ticket Chemicfest#8</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"></script>
                <script src="https://code.iconify.design/1/1.0.7/iconify.min.js"></script>
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
                    src: url("../public/fonts/Signika-VariableFont_GRAD,wght.ttf");
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
                  margin-right: 30%;
                  margin-left: 30%;
                  transition: background-color 0.3s, color 0.3s;
              }
      
              .download-button .iconify-icon {
                  margin-right: 5px;
              }
      
              .download-button:hover {
                  background-color: #000;
                  color: #fff;
                  margin-right: 30%;
                  margin-left: 30%;
              }
                </style>
              </head>
              <body class="font-signika h-full">
                <!--Header-->
                <div class="flex bg-dark p-6" style="background-image: url(https://chemicfest.site/file/assets/pattern.png); background-size: cover;">
                  <div class="mx-2 sm:mx-10 flex w-full">
                    <img src="https://chemicfest.site/file/assets/osis.png" class="w-16 sm:w-20" alt="CF Logo">
                    <p class="ms-auto text-white">E-Ticket</p>
                  </div>
                </div>
            
                <!--Informasi Acara-->
                <div class="text-5xl font-bold mt-5 mx-5 sm:mx-20">
                  <div class="flex flex-col border-2 p-4 rounded-xl">
                    <h5 class="text-2xl">Chemicfest #8 - Paduan Jiwa Harmoni</h5>
                    <div class="flex flex-col sm:flex-row mt-4 gap-7">
                      <div class="w-full sm:w-1/3">
                        <!--Poster-->
                        <img class="w-full rounded-lg" src="https://chemicfest.site/file/assets/banner.jpg" class="w-44" alt="">
                      </div>
                      <div class="flex flex-col w-full sm:w-2/3 gap-2">
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark md:w-fit" width="28" icon="heroicons-solid:badge-check" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark  font-semibold">OSIS SMK SMTI Yogyakarta</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark md:w-fit" width="28" icon="uil:schedule" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark  font-normal">14 Mei 2024</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <iconify-icon class="my-auto text-dark  md:w-fit" width="28" icon="carbon:location-filled" ></iconify-icon>
                          <p class="my-auto text-base lg:text-lg text-dark font-normal">Auditorium RRI, Jl. Affandi No.37, Mrican, Caturtunggal</p>
                        </div>
                      </div>
                    </div>
                  </div>
            
                  <!--Informasi Pesanan-->
                  <div class="flex flex-col mt-5 gap-4">
                    <h5 class="text-xl">Informasi Pesanan</h5>
                    <div class="flex flex-col sm:flex-row gap-2">
                      <div class="flex flex-col w-full sm:w-2/3 border-2 rounded-xl p-4 gap-2">
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Kode Pesanan</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">CF8-${typeticket}-${unixinvoice}</p>
                        </div>
            
                        <!--Nama Pemesan-->
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Nama Pemesan</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">${ticketData.Name}</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Berlaku Untuk</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">1 Pax</p>
                        </div>
                        <div class="flex flex-row gap-3 w-full">
                          <p class="my-auto text-base text-dark w-1/3 font-normal">Validitas Ticket</p>
                          <p class="my-auto text-base text-dark w-2/3 font-semibold">14 Mei 2024</p>
                        </div>
                      </div>
            
                      <div class="flex flex-col w-full sm:w-1/3 border-2 rounded-xl p-4 gap-2 mx-auto text-center">
                        <p class="font-bold text-lg">${amount}</p>
                        <img src=${foundTicket.UrlTicket.Qrcode} class="w-1/2 mx-auto" alt="">
                        <p class="font-light text-sm">Dibuat pada ${formattedDate}</p>
                      </div>
                    </div>
                  </div>
            
                  <!--Syarat dan Ketentuan-->
                  <div class="flex flex-col mt-5 gap-4">
                    <h5 class="text-xl">Syarat dan Ketentuan</h5>
                    <ol class="list-decimal ml-3 leading-loose text-base font-normal">
                      <li>Dengan menyelesaikan pemesanan/pembelian, Anda dianggap setuju dengan syarat dan ketentuan yang ditentukan penyelenggara.</li>
                      <li>Masa berlaku e-tiket hanya sampai 14 Mei saat acara dimulai.</li>
                      <li>Syarat dan ketentuan dapat diubah, ditambah, dihapus, atau diperbaiki sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
                      <li>Tiket hanya berlaku untuk satu orang dan satu akun (tidak dapat dipindah tangankan).</li>
                      <li>Penyelenggara konser tidak bertanggung jawab atas pembatalan atau penundaan acara yang disebabkan oleh keadaan darurat.</li>
                      <li>Setiap pemegang tiket harus menunjukkan identitas resmi (KTP atau kartu identitas lain yang sah) untuk menukarkan tiket dan untuk memasuki acara.</li>
                      <li>Jadwal acara akan diumumkan melalui platfrom resmi <a href="https://instagram.com/chemicevents" target="_blank"><b>@chemicevents</b></a>.</li>
                      <li>Pengunjung diharapkan untuk tiba tepat waktu sesuai dengan jadwal yang telah ditentukan.</li>
                      <li>Barang-barang berbahaya atau ilegal tidak diizinkan masuk ke dalam area acara.</li>
                      <li>Pengunjung diharapkan untuk mengikuti petunjuk dan arahan dari petugas keamanan dan panitia.</li>
                      <li>Panitia tidak bertanggung jawab atas kehilangan, kerusakan, atau cedera yang dialami oleh pengunjung selama acara.</li>
                      <li>Panduan tambahan atau perubahan penting akan diumumkan melalui platform resmi Chemicfest.</li>
                      <li>Penukaran tiket dilakukan di venue dan hanya bisa digunakan 1x penukaran.</li>
                    </ol>
                  </div>
                </div>
              </body>
            </html>
            `;

            //check pdf on directory
            const pdfname = `ticket_${ticketId}.pdf`;
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
        res.status(404).render("ticketnofound");
      }
    } else {
      res.status(404).render("ticketnofound");
    }
  } catch (error) {
    console.log(chalk.cyan(dateformat()), error);
    res.status(500).render("ticketnofound");
  }
});

module.exports = router;