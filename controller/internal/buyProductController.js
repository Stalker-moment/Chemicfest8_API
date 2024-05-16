const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const midtransClient = require("midtrans-client");
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

const maindatabase = "./db/maindata.json";
const cartdatabase = "./db/cart.json";
const pricelistdatabase = "./db/pricelist.json";
const configdatabase = "./db/config.json";
const product_storage = "./db/product_storage.json";

const readconfig = JSON.parse(fs.readFileSync(configdatabase));

const { isProduction } = readconfig.Midtrans;

//Midtrans configuration production
const productionmerchantid = readconfig.Midtrans.Production.MerchantID;
const productionckey = readconfig.Midtrans.Production.clientKey;
const productionskey = readconfig.Midtrans.Production.serverKey;

//Midtrans configuration sandbox
const sandboxmerchantid = readconfig.Midtrans.Sandbox.MerchantID;
const sandboxckey = readconfig.Midtrans.Sandbox.clientKey;
const sandboxskey = readconfig.Midtrans.Sandbox.serverKey;

// console.log("sandboxckey: ", sandboxckey);
// console.log("sandboxskey: ", sandboxskey);

//Midtrans configuration environment
if (isProduction) {
  var core = new midtransClient.Snap({
    isProduction: true,
    serverKey: productionskey,
    clientKey: productionckey,
  });
} else {
  var core = new midtransClient.Snap({
    isProduction: false,
    serverKey: sandboxskey,
    clientKey: sandboxckey,
  });
}

function measureTotal(cart) {
  let total = 0;
  let totalqty = 0;
  cart.forEach((product) => {
    total += product.Price * product.Qty;
    totalqty += product.Qty;
  });
  return { total, totalqty };
}

router.post("/product/add", async (req, res) => {
  const { UUID, Productid, Qty } = req.body;
  const data = JSON.parse(fs.readFileSync(maindatabase));

  //check user exist
  const user = data.find((user) => user.UUID === UUID);

  if (user) {
    const pricelist = JSON.parse(fs.readFileSync(pricelistdatabase));
    const product = pricelist.Shop.find(
      (product) => product.ProductId === Productid
    );
    if (product) {
      const cart = JSON.parse(fs.readFileSync(cartdatabase));
      const cartuser = cart.find((cart) => cart.UUID === UUID);
      if (cartuser) {
        const cartproduct = cartuser.Cart.find(
          (cartproduct) => cartproduct.ProductId === Productid
        );
        if (cartproduct) {
          cartproduct.Qty += Qty;
        } else {
          cartuser.Cart.push({
            ProductId: Productid,
            Alias: product.Alias,
            Name: product.Name,
            Description: product.Description,
            Picture: product.Picture,
            Price: product.Price,
            Unit: Productid.Unit,
            UnitName: Productid.UnitName,
            UnitSymbol: product.UnitSymbol,
            Qty: Qty,
          });
        }
      } else {
        cart.push({
          UUID: UUID,
          Name: user.Name,
          Username: user.Username,
          Cart: [
            {
              ProductId: Productid,
              Alias: product.Alias,
              Name: product.Name,
              Description: product.Description,
              Picture: product.Picture,
              Price: product.Price,
              Unit: Productid.Unit,
              UnitName: Productid.UnitName,
              UnitSymbol: product.UnitSymbol,
              Qty: Qty,
            },
          ],
          Total: 0,
          TotalUnit: "IDR",
          TotalUnitName: "Rupiah",
          TotalUnitSymbol: "Rp",
          TotalQty: 0,
          TotalQtyUnit: "Pcs",
        });
      }
      fs.writeFileSync(cartdatabase, JSON.stringify(cart));

      const total = measureTotal(cart.find((cart) => cart.UUID === UUID).Cart);
      cart.find((cart) => cart.UUID === UUID).Total = total.total;
      cart.find((cart) => cart.UUID === UUID).TotalQty = total.totalqty;
      fs.writeFileSync(cartdatabase, JSON.stringify(cart, null, 2));
      res.status(200).json({ message: "Product added to cart" });
    } else {
      res.status(400).json({ message: "Product not found" });
    }
  } else {
    res.status(400).json({ message: "User not found" });
  }
});

router.post("/product/remove", async (req, res) => {
  const { UUID, Productid } = req.body;
  const cart = JSON.parse(fs.readFileSync(cartdatabase));
  const cartuser = cart.find((cart) => cart.UUID === UUID);
  if (cartuser) {
    const cartproduct = cartuser.Cart.find(
      (cartproduct) => cartproduct.ProductId === Productid
    );
    if (cartproduct) {
      cartuser.Cart = cartuser.Cart.filter(
        (cartproduct) => cartproduct.ProductId !== Productid
      );
      fs.writeFileSync(cartdatabase, JSON.stringify(cart));

      const total = measureTotal(cart.find((cart) => cart.UUID === UUID).Cart);
      cart.find((cart) => cart.UUID === UUID).Total = total.total;
      cart.find((cart) => cart.UUID === UUID).TotalQty = total.totalqty;
      fs.writeFileSync(cartdatabase, JSON.stringify(cart, null, 2));
      res.status(200).json({ message: "Product removed from cart" });
    } else {
      res.status(400).json({ message: "Product not found" });
    }
  } else {
    res.status(400).json({ message: "User not found" });
  }
});

router.post("/product/update", async (req, res) => {
  const { UUID, Productid, Qty } = req.body;
  const cart = JSON.parse(fs.readFileSync(cartdatabase));
  const cartuser = cart.find((cart) => cart.UUID === UUID);
  if (cartuser) {
    const cartproduct = cartuser.Cart.find(
      (cartproduct) => cartproduct.ProductId === Productid
    );
    if (cartproduct) {
      cartproduct.Qty = Qty;
      fs.writeFileSync(cartdatabase, JSON.stringify(cart));

      if (Qty === 0) {
        //remove product from cart
        cartuser.Cart = cartuser.Cart.filter(
          (cartproduct) => cartproduct.ProductId !== Productid
        );
        const total = measureTotal(
          cart.find((cart) => cart.UUID === UUID).Cart
        );
        fs.writeFileSync(cartdatabase, JSON.stringify(cart));
        cart.find((cart) => cart.UUID === UUID).Total = total.total;
        cart.find((cart) => cart.UUID === UUID).TotalQty = total.totalqty;
        fs.writeFileSync(cartdatabase, JSON.stringify(cart, null, 2));
      } else {
        const total = measureTotal(
          cart.find((cart) => cart.UUID === UUID).Cart
        );
        cart.find((cart) => cart.UUID === UUID).Total = total.total;
        cart.find((cart) => cart.UUID === UUID).TotalQty = total.totalqty;
        fs.writeFileSync(cartdatabase, JSON.stringify(cart, null, 2));
      }

      res.status(200).json({ message: "Product updated" });
    } else {
      res.status(400).json({ message: "Product not found" });
    }
  } else {
    res.status(400).json({ message: "User not found" });
  }
});

router.post("/product/checkout", async (req, res) => {
  try {
    const { UUID } = req.body;
    const data = JSON.parse(fs.readFileSync(maindatabase));
    const user = data.find((user) => user.UUID === UUID);
    const cart = JSON.parse(fs.readFileSync(cartdatabase));
    const cartuser = cart.find((cart) => cart.UUID === UUID);

    //check cart exist (check array length)
    if (cartuser.Cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (cartuser) {
      const total = measureTotal(cart.find((cart) => cart.UUID === UUID).Cart);
      cart.find((cart) => cart.UUID === UUID).Total = total.total;
      cart.find((cart) => cart.UUID === UUID).TotalQty = total.totalqty;
      fs.writeFileSync(cartdatabase, JSON.stringify(cart, null, 2));

      if(total.total === 0){
        return res.status(400).json({ message: "Plase Buy Something, before checkout" });
      }

      const ids_trans =
        "PRODUCT" + "_" + UUID.toString() + "_" + Date.now().toString();

      const transaction_details = {
        order_id: ids_trans,
        gross_amount: total.total,
      };

      //don't use credit card, just QRIS
      const credit_card = {
        secure: true,
      };

      const customer_details = {
        first_name: user.Name,
        email: user.Email,
        phone: user.Phone,
      };

      const item_details = cartuser.Cart.map((product) => {
        return {
          id: product.ProductId,
          price: product.Price,
          quantity: product.Qty,
          name: product.Name,
        };
      });
      

      const parameter = {
        transaction_details,
        credit_card,
        customer_details,
        item_details,
      };

      // core
      //   .charge(parameter)
      //   .then((chargeResponse) => {
      //     res.status(200).json(chargeResponse);
      //   })
      //   .catch((err) => {
      //     res.status(400).json(err);
      //   });
      var token = await core.createTransactionToken(parameter);
      //check if token is exist
      if (token) {
        console.log(
          chalk.cyan(dateformat()), 
          chalk.bgGreen(`[Checkout Succes]`),
          chalk.blue(`${UUID}`),
          chalk.white(`checkout product success!`),
          chalk.inverse(`TOKEN: ${token}`),
          chalk.white(`.`)
        );
        //delete cart after checkout dan make product storage
        const product_storagedb = JSON.parse(fs.readFileSync(product_storage));
        const product_storage_user = product_storagedb.find(
          (product_storagedb) => product_storagedb.UUID === UUID
        );

        if (product_storage_user) {
          product_storage_user.Transaction.push({
            OrderID: ids_trans,
            Method: "QRIS",
            Status: "Pending",
            Amount: total.total,
            Unit: "IDR",
            Invoice: "",
            Time: Date.now(),
            ProductList: cartuser.Cart,
          });
        } else {
          const storage_json = {
            UUID: UUID,
            Name: user.Name,
            Username: user.Username,
            Email: user.Email,
            Phone: user.Phone,
            Transaction: [
              {
                OrderID: ids_trans,
                Method: "QRIS",
                Status: "Pending",
                Amount: total.total,
                Unit: "IDR",
                Invoice: "",
                Time: Date.now(),
                ProductList: cartuser.Cart,
              },
            ],
            Create_At: Date.now(),
          };
          product_storagedb.push(storage_json);
        }

        fs.writeFileSync(
          product_storage,
          JSON.stringify(product_storagedb, null, 2)
        );

        cart.find((cart) => cart.UUID === UUID).Cart = [];
        cart.find((cart) => cart.UUID === UUID).Total = 0;
        cart.find((cart) => cart.UUID === UUID).TotalQty = 0;
        fs.writeFileSync(cartdatabase, JSON.stringify(cart, null, 2));
        return res.status(200).json({
          code: 200,
          message: "checkout product success",
          token: token,
        });
      } else {
        console.log(
          chalk.cyan(dateformat()), 
          chalk.bgRed(`[System Error]`),
          chalk.blue(`${UUID}`),
          chalk.white(`checkout product failed!`)
        );
        return res
          .status(500)
          .json({ code: 500, message: "checkout product failed" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (err) {
    console.log(chalk.cyan(dateformat()), err);
    return res.status(500).json({
      code: 500,
      message: "checkout product failed, internal server error",
    });
  }
});

router.post("/product/paymentstatus", async (req, res) => {
  const { UUID, OrderID, Status } = req.body;
  const product_storagedb = JSON.parse(fs.readFileSync(product_storage));
  const product_storage_user = product_storagedb.find(
    (product_storagedb) => product_storagedb.UUID === UUID
  );

  if (product_storage_user) {
    const transaction = product_storage_user.Transaction.find(
      (transaction) => transaction.OrderID === OrderID
    );
    if (transaction) {
      transaction.Status = Status;
      fs.writeFileSync(
        product_storage,
        JSON.stringify(product_storagedb, null, 2)
      );
      res
        .status(200)
        .json({
          code: 200,
          message: "Payment status updated",
          data: transaction,
        });
    } else {
      res.status(400).json({ code: 400, message: "Transaction not found" });
    }
  } else {
    res.status(400).json({ code: 400, message: "User not found" });
  }
});

router.get("/product/cart/:UUID", async (req, res) => {
  const UUID = req.params.UUID;
  const cart = JSON.parse(fs.readFileSync(cartdatabase));
  if (UUID === "all") {
    const formattedJson = JSON.stringify(cart, null, 2);
    res.setHeader("Content-Type", "application/json");
    res.send(formattedJson);
    return;
  } else {
    var UUID_Int = parseInt(UUID);
  }
  const cartuser = cart.find((cart) => cart.UUID === UUID_Int);
  if (cartuser) {
    const formattedJson = JSON.stringify(cartuser, null, 2);

    // Mengirimkan JSON langsung sebagai respons HTTP
    res.setHeader("Content-Type", "application/json");
    res.send(formattedJson);
  } else {
    res.status(400).json({ message: "User not found" });
  }
});

router.get("/product/storage/:UUID", async (req, res) => {
  const UUID = req.params.UUID;
  const product_storagedb = JSON.parse(fs.readFileSync(product_storage));
  if (UUID === "all") {
    const formattedJson = JSON.stringify(product_storagedb, null, 2);

    // Mengirimkan JSON langsung sebagai respons HTTP
    res.setHeader("Content-Type", "application/json");
    res.send(formattedJson);
    return;
  } else {
    var UUID_Int = parseInt(UUID);
  }
  const product_storage_user = product_storagedb.find(
    (product_storagedb) => product_storagedb.UUID === UUID_Int
  );
  if (product_storage_user) {
    const formattedJson = JSON.stringify(product_storage_user, null, 2);

    // Mengirimkan JSON langsung sebagai respons HTTP
    res.setHeader("Content-Type", "application/json");
    res.send(formattedJson);
  } else {
    res.status(400).json({ message: "User not found" });
  }
});

module.exports = router;
