const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const { Pool, Client } = require('pg');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

app.use(express.static('public'));
app.use(bodyParser.json({type:'application/json'}));
app.use(bodyParser.urlencoded({extended:true}));

const pool = new Pool({
  user: 'mark',
  host: 'localhost',
  database: 'irr',
  password: process.env.databasePw,
  port: 5432,
});

app.post("/login", function(req, res){
  console.log(req.body);
});

app.get("/", function(req, res) {
  res.sendfile('index.html');
});

app.listen(5000, function() {
  console.log("Listening on 5000");
});
