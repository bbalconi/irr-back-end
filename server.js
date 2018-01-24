const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const { Pool, Client } = require('pg');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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

app.post("/authenticate", function(req, resp){ 
  pool.connect().then((client, done)=>{
    client.query(`select * from users where email='${req.body.email}'`).then((res)=>{
      //can put more claims into this user obj
      var user = {
        user:res.rows[0].email
      };
      var token = jwt.sign(user, app.get('superSecret'), {
        //expiresInMinutes: 1440 // expires in 24 hours, no longer valid, probs deprecated
      });
      resp.json({
        message:"success",
        token:token
      });
    });
  }, (err)=>{
    console.log(err);
  });
//  res.json('dude');
});

app.get('/waterings', (req, res)=>{
  pool.connect().then((client, done)=>{
    client.query(`select * from waterings inner join durations on waterings.duration = durations.did`).then((dBRes)=>{
      console.log(dBRes.rows);
      res.json(dBRes.rows);
    }, (e)=>{
      res.json(e);
    });
  });
});

app.get('/test', (req, res)=>{
  res.json('f');
});

//TODO: put all routing in a seperate file

app.post('/waterings', (req, res)=>{
  pool.connect().then((client, done) => {
    client.query(`insert into durations (total_duration) values ( ${req.body.duration}) returning *`).then((durationDbRes)=>{
      let durationId = durationDbRes.rows[0].did;
      client.query(`insert into waterings (start, zones, duration) values ('${req.body.start}', '{3, 4}', '${durationId}') returning *`).then((dbRes) => {
        res.json('inserted dude');
      });
    });
  });
});
app.get("/", function(req, res) {
  res.sendfile('index.html');
});

app.listen(5000, function() {
  console.log("Listening on 5000");
});
