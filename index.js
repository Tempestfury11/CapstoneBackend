// IMPORTING MODULES
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const db = require("./config/dbconn");
const { compare, hash } = require("bcrypt");
const { stringify } = require("querystring");
const jwt = require("jsonwebtoken");
const cp = require("cookie-parser");
const app = express();
const router = express.Router();
const port = parseInt(process.env.PORT) || 4000;

// SERVER LISTEN
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
// allow access to fetch data from the api externally by  Seting header
app.use((req, res, next) => {
  res.setHeader("mode", "no-cors");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-*", "*");
  next();
});
app.use(
  cors({
    mode: "no-cors",
    origin: [
      "http://127.0.0.1:8080",
      "http://localhost:8080",
      "http://192.168.9.62:8080/",
    ],
    credentials: true,
  })
);
// add cors to the app variable
app.use(
  router,
  cors(),
  express.json(),
  express.urlencoded({
    extended: true,
  })
);
// HOME PAGE ROUTER
router.get("/", (req, res) => {
  res.status(200).sendFile("./views/index.html", {
    root: __dirname,
  });
});
//  PAGE ROUTER
router.get("/", (req, res) => {
  res.status(200).sendFile("./views/.html", {
    root: __dirname,
  });
});
// products PAGE ROUTER
router.get("/products1", (req, res) => {
  res.status(200).sendFile("./views/products.html", {
    root: __dirname,
  });
});
// login PAGE ROUTER
router.get("/login", (req, res) => {
  res.status(200).sendFile("./views/login.html", {
    root: __dirname,
  });
});
// register PAGE ROUTER
router.get("/register", (req, res) => {
  res.status(200).sendFile("./views/register.html", {
    root: __dirname,
  });
});
// GET ALL PRODUCTS
router.get("/products", (req, res) => {
  // Query
  const strQry = `
    SELECT *
    FROM products;
    `;
  db.query(strQry, (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      results: results,
    });
  });
});
//

router.post('/register', bodyParser.json(), async (req, res) => {
  const emails = `SELECT email FROM users WHERE ?`;
  let bd = req.body;
  let details = {
      email: bd.email,
  }
  db.query(emails, details, async (err, results) =>{
    if(results.length > 0){
   res.json({
    msg:"The email already exist"
  });
  console.log(results.length)
    }else{
  
  console.log(bd);
  bd.password = await hash(bd.password, 10)
  if ((bd.userRole === null) || (bd.userRole === undefined)) {
    bd.userRole = 'user'
  }
  let sql = `INSERT INTO users (firstName, lastName, email, phoneNo, password)VALUES (?, ?, ?, ?, ?);`
  db.query(sql, [bd.firstName, bd.lastName, bd.email, bd.phoneNo, bd.password], (err, results) => {
    if (err){
        return {
          msg: "The email already exist"
        }
    }
    else {
      console.log(results)
      res.json({
        msg : 'You are ready to get games',
        userData : results
      })
    }
  })};
  })
});
//login
app.post("/login", bodyParser.json(), (req, res) => {
  try {
    // Get email and password
    const { email, password } = req.body;
    const strQry = `
        SELECT *
        FROM users
        WHERE email = '${email}';
        `;
    db.query(strQry, async (err, results) => {
      if (err) throw err;
      console.log(results)
      if(results.length === 0){
        res.json({
          msg: 'Email does not exist'
        })
      }else {
        console.log(results[0])
        await compare(password, results[0].password)
          jwt.sign(
            JSON.stringify(results[0]),
            process.env.secret,
            (err, token) => {
              if (err) throw err;
              res.json({
                status: 200,
                user: results[0],
                token: token,
              });
            }
          )
      }
    });
  } catch (e) {
    console.log(`From login: ${e.message}`);
  }
});
// get all users
router.get("/users", (req, res) => {
  //mySQL query
  const strQry = `SELECT * FROM users`;
  db.query(strQry, (err, results) => {
    if (err) {
      console.log(err);
      res.send(`
            <h1>${err}.</h1><br>
            <a href="/">Go Back.</a>
            `);
    } else {
      res.json({
        status: 200,
        results: results,
      });
    }
  });
});
// get 1 user
router.get("/users/:id", (req, res) => {
  //mySQL query
  const strQry = `
    SELECT * FROM users WHERE id = ?;
    `;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      results: results.length <= 0 ? "Sorry no product was found" : results,
    });
  });
});
//delete user
app.delete("/users/:id", (req, res) => {
  //mySQL query
  const strQry = `
    DELETE FROM users WHERE id = ?;
    ALTER TABLE users AUTO_INCREMENT = 1;
    `;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err)
      res.json({
        status: 400,
        msg: `${err}`,
      });
    // else
    res.json({
      status: 200,
      msg: `USERS WAS DELETED`,
    });
  });
});
//Update user
router.put("/users/:id", bodyParser.json(), async (req, res) => {
  const { firstName, lastName, email, phoneNo, password } = req.body;
  let sql = `UPDATE users SET ? WHERE id =${req.params.id}`;
  const user = {
    firstName,
    lastName,
    email,
    phoneNo,
    password,
  };
  db.query(sql, user, (err) => {
    if (err) {
      console.log(err);
      res.send(`
            <h1>${err}.</h1><br>
            <a href="/">Go Back.</a>
            `);
    } else {
      res.json({
        msg: "Updated user Successfully",
      });
    }
  });
});
// create products
app.post("/products", bodyParser.json(), (req, res) => {
  try {
    const { title, price, category, description, img } = req.body;
    // mySQL query
    const strQry = `
    INSERT INTO products (title, price, category, description, img) values (?, ?, ?, ?, ?)
    `;
    //
    db.query(
      strQry,
      [title, price, category, description, img],
      (err, results) => {
        if (err) {
          console.log(err);
          res.send(
            `
               <h1>${err}.</h1><br>
             
                `
          );
        } else {
          res.send(`
                    number of affected row/s: ${results.affectedRows} <br>
                    
                    `);
        }
      }
    );
  } catch (e) {
    console.log(`Create a new product: ${e.message}`);
  }
});
// get 1 product
router.get("/products/:id", (req, res) => {
  //mySQL query
  const strQry = `
    SELECT * FROM products WHERE id = ?;
    `;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      results: results.length <= 0 ? "Sorry no product was found" : results,
    });
  });
});
//delete products
app.delete("/products/:id", (req, res) => {
  //mySQL query
  const strQry = `
    DELETE FROM products WHERE id = ?;
    ALTER TABLE products AUTO_INCREMENT = 1;
    `;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err)
      res.json({
        status: 400,
        msg: `${err}`,
      });
    res.json({ msg: `delete` });
  });
});
//Update products
router.put("/products/:id", bodyParser.json(), async (req, res) => {
  const { title, price, category, description, img } = req.body;
  let sql = `UPDATE products SET ? WHERE id =${req.params.id}`;
  const user = {
    title,
    price,
    category,
    description,
    img,
  };
  db.query(sql, user, (err) => {
    if (err) {
      console.log(err);
      res.send(`
            <h1>${err}.</h1><br>
            `);
    } else {
      res.json({
        msg: "Updated products Successfully",
      });
    }
  });
});
// get all products
router.get("/products", (req, res) => {
  //mySQL query
  const strQry = `SELECT * FROM products`;
  db.query(strQry, (err, results) => {
    if (err) {
      console.log(err);
      res.send(`
            <h1>${err}.</h1><br>
            <a href="/">Go Back.</a>
            `);
    } else {
      res.json({
        status: 200,
        results: results,
      });
    }
  });
});

// CART
//*ADD CART ITEMS FROM SPECIFIC USER*//
// router.post('/users/:id/cart', bodyParser.json(), (req, res) => {

//     // mySQL query
//     let cart = `SELECT cart FROM users WHERE id = ${req.params.id};`;
//     // function
//     db.query(cart, (err, results) => {
//         if (err) throw err
//         if (results.length > 0) {
//             let cart;
//             if (results[0].cart == null) {
//                 cart = []
//             } else {
//                 cart = JSON.parse(results[0].cart)
//             }

//     let { Prod_id } = req.body;
//     // mySQL query
//     let product = `Select * FROM products WHERE id = ?`;
//     // function
//     db.query(product, Prod_id, (err, productData) => {
//         if (err) res.send(`${err}`)
//         let data = {
//             cart_id : cart.length + 1,
//             productData
//         }
//         cart.push(data)
//         console.log(cart);
//         let updateCart = `UPDATE users SET cart = ? WHERE id = ${req.params.id}`
//         db.query(updateCart, JSON.stringify(cart), (err, results) => {
//             if (err) res.send(`${err}`)
//             res.json({
//                 cart: results
//             })
//         })
//     })
// }})
// });
router.post("/users/:id/cart", bodyParser.json(), (req, res) => {
  // mySQL query
  let cart = `SELECT cart FROM users WHERE id = ${req.params.id};`;
  // function
  db.query(cart, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      let cart;
      if (results[0].cart == null) {
        cart = [];
      } else {
        cart = JSON.parse(results[0].cart);
      }
      let { id } = req.body;
      // mySQL query
      let product = `Select * FROM products WHERE id = ?`;
      // function
      db.query(product, id, (err, productData) => {
        if (err) res.send(`${err}`);
        let data = {
          cart_id: cart.length + 1,
          id: productData[0].id,
          title: productData[0].title,
          price: productData[0].price,
          category: productData[0].category,
          description: productData[0].description,
          img: productData[0].img,
        };
        cart.push(data);
        // console.log(cart);
        let updateCart = `UPDATE users SET cart = ? WHERE id = ${req.params.id}`;
        db.query(updateCart, JSON.stringify(cart), (err, results) => {
          if (err)
            res.json({
              status: 400,
              msg: `${err}`,
            });
          res.json({
            status: 200,
            cart: results,
            msg : "Added Product to Cart"
          });
        });
      });
    }
  });
});
//*GET CART ITEMS FROM SPECIFIC USER*
router.get("/users/:id/cart", (req, res) => {
  // Query
  const strQry = `
SELECT cart
FROM users
WHERE id = ?;
`;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      results: JSON.parse(results[0].cart),
    });
  });
});
//*GET single ITEMS FROM SPECIFIC USER*
router.get("/users/:id/cart/:id", (req, res) => {
  // Query
  const strQry = `
SELECT *
FROM users
WHERE id = ?;
`;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      results: JSON.parse(results[0].cart),
    });
  });
});
//*DELETE CART ITEMS FROM SPECIFIC USER*
router.delete("/users/:id/cart", (req, res) => {
  // Query
  const strQry = `UPDATE users SET cart=null WHERE id=?`;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err)
      res.json({
        status: 400,
        meg: `${err}`,
      });
    res.json({
      status: 200,
      results: results,
    });
  });
});
// Delete by cart id
router.delete("/users/:id/cart/:cartId", (req, res) => {
  const delSingleCartId = `
    SELECT cart FROM users
    WHERE id = ${req.params.id}
`;
  db.query(delSingleCartId, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      if (results[0].cart != null) {
        const result = JSON.parse(results[0].cart).filter((cart) => {
          return cart.cart_id != req.params.cartId;
        });
        result.forEach((cart, i) => {
          cart.cart_id = i + 1;
        });
        const query = `
                UPDATE users
                SET cart = ?
                WHERE id = ${req.params.id}
            `;
        db.query(query, [JSON.stringify(result)], (err, results) => {
          if (err) throw err;
          res.json({
            status: 200,
            result: "Successfully deleted item from cart",
          });
        });
      } else {
        res.json({
          status: 400,
          meg: `${err}`,
        });
      }
    } else {
      res.json({
        status: 400,
        meg: `${err}`,
      });
    }
  });
});
