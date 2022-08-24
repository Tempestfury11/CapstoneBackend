// IMPORTING MODULES
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./config/dbconn');
const { compare, hash } = require('bcrypt');
const { stringify } = require('querystring');
const jwt = require('jsonwebtoken');
const cp = require('cookie-parser');
const app = express();
const router = express.Router();
const port = parseInt(process.env.PORT) || 4000;

// SERVER LISTEN
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// allow access to fetch data from the api externally by  Seting header
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    next();
});

app.use(cors({
    origin: ['http://127.0.0.1:8080', 'http://localhost:8080'],
    credentials: true
}));

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
        root: __dirname
    });
});
// REGISTER PAGE ROUTER
router.get("/register", (req, res) => {
    res.status(200).sendFile("./views/register.html", {
        root: __dirname
    });
});
// Login PAGE ROUTER
router.get("/login", (req, res) => {
    res.status(200).sendFile("./views/login.html", {
        root: __dirname
    });
});

// products PAGE ROUTER
router.get("/products1", (req, res) => {
    res.status(200).sendFile("./views/products.html", {
        root: __dirname
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
// connect to database (TO MAKE SURE ITS CONNECTED).
db.connect( (err) => {
    if(err){
        console.log(`mySQL is not connected...<br>
        ${err}`)
    } else{
        console.log('mySQL connected...')
    }
});

//register
app.post('/register',bodyParser.json(),async(req,res)=>{
    try{const bd = req.body;
    // Encrypting a password
    //Default value of salt is 10.
bd.password = await hash(bd.password,16);

    //mySQL query
    const strQry =
    `
    insert into users(firstName, lastName, email, phoneNo, password) value(?, ?, ?
        , ?, ?);
    `;
    db.query(strQry,
        [bd.firstName,bd.lastName,bd.email,bd.phoneNo,bd.password],
        (err,results)=> {
            if(err){
                console.log(err);
                res.send(`<h1>${err}.</h1><br>
                `)
            } else{
                console.log(results);
                res.send(`register successful`)
            }
        });
} catch(e) {
    console.log(`FROM REGISTER: ${e.message}`);
}
});
//login
app.post('/login',bodyParser.json(),async(req,res)=>{
    try{
        //get email and password
        const{email,password} = req.body;

        //mySQL query
        const strQry =
        `
        SELECT email, password FROM users WHERE email = '${email}';
        `;
        db.query(strQry,async(err,results)=>{
            if(err){
                console.log(err);
                res.send(`
                <h1>${err}.</h1><br>
               
                `)
            }else{
                switch(true){
                    case(await compare(password,results[0].password)):
                    res.send('successfull login')
                    break
                    default:
                        console.log("Logged In Successfully.");
                        //res.redirect('/login');
                        res.send(`        <h1>Email or Password was Incorrect.<br>Please Insert the correct Email & Password.</h1><br>
                       
                        `);
                    };
                }
                })
            } catch(e){
                console.log(`FROM LOGIN ${e.message}.`);
                res.send(`
                ${e.message}.<br>
                <a href="/login">Go Back.</a>
                `)
            }
        }
);
// get all users
router.get('/users',(req,res)=>{
    //mySQL query
    const strQry =`SELECT * FROM users`;
    db.query(strQry,(err,results)=>{
        if(err){
            console.log(err);
            res.send(`
            <h1>${err}.</h1><br>
            <a href="/">Go Back.</a>
            `)
        } else{
            res.json({
                status:200,
                results:results,
            })
        }
    })
});
// get 1 user
router.get('/users/:id',(req,res)=>{
    //mySQL query
    const strQry =
    `
    SELECT * FROM users WHERE id = ?;
    `;
    db.query(strQry,[req.params.id],(err,results) =>{
        if(err)throw err;
        res.json({
            status:200,
            results:(results.length<=0)?'Sorry no product was found':results
        })
    })
});
//delete user
app.delete('/users/:id',(req, res)=>{
    //mySQL query
    const strQry =
    `
    DELETE FROM users WHERE id = ?;
    ALTER TABLE users AUTO_INCREMENT = 1;
    `;
    db.query(strQry, [req.params.id], (err,results)=>{
        if(err) throw err;
        res.send(`USERS WAS DELETED`);
    });
});
//Update user
router.put("/users/:id",bodyParser.json(),async(req,res)=>{
    const {firstName, lastName, email, phoneNo, password} = req.body;
    let sql = `UPDATE users SET ? WHERE id =${req.params.id}`;
    const user = {
        firstName, lastName,email,phoneNo,password
    };
    db.query(sql,user,(err)=>{
        if(err){
            console.log(err);
            res.send(`
            <h1>${err}.</h1><br>
            <a href="/register">Go Back.</a>
            `)
        } else{
            res.json({
                msg:"Updated user Successfully",
            });
        }
    });
});

// create products
app.post('/products', bodyParser.json(),
    (req, res)=> {
    try{
       const {title, price, category, description, img} = req.body;
         // mySQL query
    const strQry =
    `
    INSERT INTO products (title, price, category, description, img) values (?, ?, ?, ?, ?)
    `;
        //
        db.query(strQry,
            [title, price, category, description, img],
            (err, results)=> {
                if(err){
console.log(err);
res.send(
                `
               <h1>${err}.</h1><br>
             
                `);
                } else{
                    res.send(`
                    number of affected row/s: ${results.affectedRows} <br>
                    
                    `);
                }
            })
    }catch(e) {
        console.log(`Create a new product: ${e.message}`);
    }
});
// get 1 product
router.get('/products/:id',(req,res)=>{
    //mySQL query
    const strQry =
    `
    SELECT * FROM products WHERE id = ?;
    `;
    db.query(strQry,[req.params.id],(err,results) =>{
        if(err)throw err;
        res.json({
            status:200,
            results:(results.length<=0)?'Sorry no product was found':results
        })
    })
});
//delete products
app.delete('/products/:id',(req, res)=>{
    //mySQL query
    const strQry =
    `
    DELETE FROM products WHERE id = ?;
    ALTER TABLE products AUTO_INCREMENT = 1;
    `;
    db.query(strQry, [req.params.id], (err,results)=>{
        if(err) throw err;
        res.send(`PRODUCTS WAS DELETED`);
    });
});
//Update products
router.put("/products/:id",bodyParser.json(),async(req,res)=>{
    const {title, price, category, description, img} = req.body;
    let sql = `UPDATE products SET ? WHERE id =${req.params.id}`;
    const user = {
        title, price, category, description, img
    };
    db.query(sql,user,(err)=>{
        if(err){
            console.log(err);
            res.send(`
            <h1>${err}.</h1><br>
            `)
        } else{
            res.json({
                msg:"Updated products Successfully",
            });
        }
    });
});
// get all products
router.get('/products',(req,res)=>{
    //mySQL query
    const strQry =`SELECT * FROM products`;
    db.query(strQry,(err,results)=>{
        if(err){
            console.log(err);
            res.send(`
            <h1>${err}.</h1><br>
            <a href="/">Go Back.</a>
            `)
        } else{
            res.json({
                status:200,
                results:results,
            })
        }
    })
});