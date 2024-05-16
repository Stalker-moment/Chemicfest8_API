const puppeteer = require('puppeteer');

async function convertHtmlToPdf(htmlContent, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set konten HTML ke halaman
  await page.setContent(htmlContent);
  
  // Konversi halaman ke PDF
  await page.pdf({ path: outputPath, format: 'letter' });
  
  await browser.close();
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ticket Chemicfest#8</title>
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
    </style>
  </head>
  <body class="font-signika h-full">
    <!--Header-->
    <div class="flex bg-dark p-6" style="background-image: url(https://chemicfest.site/file/assets/pattern.png); background-size: cover;">
      <div class="mx-10 flex w-full">
        <img src="https://chemicfest.site/file/assets/osis.png" class="w-20" alt="CF Logo">
        <p class="ms-auto text-white">E-Ticket</p>
      </div>
    </div>

    <!--Informasi Acara-->
    <div class="text-5xl font-bold mt-5 mx-20">
      <div class="flex flex-col border-2 p-4 rounded-xl">
        <h5 class="text-base">Chemicfest #8 - Enjoy The Show Let The Retro Flow</h5>
        <div class="flex mt-4 gap-7">
          <div class="w-1/4">
            <img src="https://chemicfest.site/file/assets/logo.png" class="w-44" alt="">
          </div>
          <div class="flex flex-col w-3/4 gap-2">
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
        <div class="flex gap-2">
          <div class="flex flex-col w-2/3 border-2 rounded-xl p-4 gap-2">
            <div class="flex flex-row gap-3 w-full">
              <p class="my-auto text-base text-dark w-1/3 font-normal">Kode Pesanan</p>
              <p class="my-auto text-base text-dark w-2/3 font-semibold">CF8-2024-0001</p>
            </div>
            <div class="flex flex-row gap-3 w-full">
              <p class="my-auto text-base text-dark w-1/3 font-normal">Nama Pemesan</p>
              <p class="my-auto text-base text-dark w-2/3 font-semibold">NATASHA CHRISTINA PUTRI</p>
            </div>
            <div class="flex flex-row gap-3 w-full">
              <p class="my-auto text-base text-dark w-1/3 font-normal">Berlaku Untuk</p>
              <p class="my-auto text-base text-dark w-2/3 font-semibold">1 Pax</p>
            </div>
            <div class="flex flex-row gap-3 w-full">
              <p class="my-auto text-base text-dark w-1/3 font-normal">Validitas Voucher</p>
              <p class="my-auto text-base text-dark w-2/3 font-semibold">14 Mei 2024</p>
            </div>
          </div>
          <div class="flex flex-col w-1/3 border-2 rounded-xl p-4 gap-2 mx-auto text-center">
            <p class="font-bold text-lg">IDR 40.000</p>
            <img src="https://chemicfest.site/file/ticket/qrcode/250612194826185650000277727975.png" class="w-1/2 mx-auto" alt="">
            <p class="font-light text-base">Dibuat pada 17 Agustus 1945</p>
          </div>
        </div>
      </div>
      <div class="flex flex-col mt-5 gap-4">
        <h5 class="text-xl">Syarat dan Ketentuan</h5>
        <p class="leading-loose text-base font-normal">
          - General Sales dimulai pada 20 April 2024 pukul 14.00 WIB <br>
          - Maks. pembelian 1 tiket per akun/ID per show day. <br>
          - Wajib login ke akun chemicfest.com untuk melakukan pembelian. <br>
          - Selesaikan pembayaran maksimal 15 menit setelah melakukan pemesanan. E-tiket tidak akan terbit jika pembayaran
          dilakukan setelah waktu pembayaran habis.<br>
        </p>
      </div>

    </div>
  </body>
</html>
`;
const outputPath = 'output.pdf';

convertHtmlToPdf(htmlContent, outputPath)
  .then(() => console.log('PDF saved successfully to:', outputPath))
  .catch(error => console.error('Error saving PDF:', error));
