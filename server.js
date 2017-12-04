const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const { Pool, Client } = require('pg');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
require('dotenv').config();

app.use(express.static('public'));
app.use(bodyParser.json({type:'application/json'}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(morgan('dev'));
app.set('superSecret', "hmmm");

const pool = new Pool({
  user: 'mark',
  host: 'localhost',
  database: 'irr',
  password: process.env.psqlPW,
  port: 5432,
});

// pool.query('SELECT * from users', (err, res) => {
//   console.log(err, res);
//   //pool.end()
// });

app.post("/authenticate", function(req, res){ 
  pool.connect().then((client, done)=>{
    client.query(`select * from users where email='${req.body.email}'`).then((res)=>{
      //can put more claims into this user obj
      var user = {
        user:res.rows[0].email
      };
      var token = jwt.sign(user, app.get('superSecret'), {
        //expiresInMinutes: 1440 // expires in 24 hours, no longer valid, probs deprecated
      });
      res.json({
        message:"success",
        token:token
      });
    });
  }, (err)=>{
    console.log(err);
  });
  res.json('dude');
});

app.get("/", function(req, res) {
  res.sendfile('index.html');
});

app.listen(5000, function() {
  console.log("Listening on 5000");
});
