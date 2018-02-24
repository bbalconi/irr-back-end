const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const { Pool, Client } = require('pg');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const camelcaseKeys = require('camelcase-keys');
const moment = require('moment');
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

// var verifyToken = (req, res, next)=>{
//   jwt.verify(req.body.token, "hmmm", (err, decoded)=>{
//     if (err){
//       res.status(403);
//     } else {
//       next();
//     }
//   });
// };

app.post('/system',(req, res)=>{
  pool.connect().then((client, done) => {
    //this might not work but this is where to start.
    //get this working, then populate some data into the zones table and viola! 
    //you should see some shit populated in the /createSystem. Now just have
    //the component update the zone table and we are good to go!
    client.query(`select * from systems`).then((system) => {
      client.query(`select * from zones`).then((zones) => {
        var response = {
          system: system.rows[0],
          zones: zones.rows
        };
        res.json(response);
        client.release();
      }, (e) => {
        res.json(e);
        client.release();
      }, (e) => {
        res.json(e);
        client.release();
      });
    }, (e) => {
      res.json(e);
      client.release();
    });
  });
});

app.post('/authenticate', function(req, resp){ 
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
});

//currently doing - trying to get the zones and descriptions into the systems table. Then, I can pull out the number of zones
//for the water usage by zones for the reporting...

app.post('/updateSystem', (req, res)=>{
  pool.connect().then((client, done)=>{
    client.query(`insert into systems (name, location) values ('${req.body.name}', '${req.body.location}')`).then((dBRes)=>{
      res.json(camelcaseKeys(dBRes.rows));
      client.release();
    }, (e)=>{
      res.json(e);
      client.release();
    }, (e)=>{
      res.json(e);
      client.release();
    });
  }, (e)=>{
    res.json(e);
    client.release();
  });
});

app.post('/monthlyWaterings', (req, res)=>{
  pool.connect().then((client, done)=>{
    client.query(`select * from waterings`).then((dBRes)=>{
      // totals is an array of objects that correspond to each month in a calendar year
      // I like using this since moment.month() returns a 0-indexed int

      let totals = [
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        },
        {
          totalDuration:0,
          totalWaterUsage:0
        }
      ];

      dBRes.rows.forEach((w)=>{
        //TODO: support multi-day waterings
        w.duration = moment(w.actual_end_time).diff(w.actual_start_time, "milliseconds");
        let totalDuration = w.duration;
        totals[moment(w.actual_end_time).month()].totalDuration += w.duration;
      });
      totals.forEach((t, i)=>{
        t.totalWaterUsage = (t.totalDuration/ (60000 * 60) ) * 15;
        t.month = moment().month(i).format("MMM");
      });
      res.json(totals);
      client.release();
    }, (e)=>{
      res.json(e);
      client.release();
    }, (e)=>{
      res.json(e);
      client.release();
    });
  }, (e)=>{
    res.json(e);
    client.release();
  });
});

app.post('/zoneUsage', (req, res)=>{
  pool.connect().then((client, done)=>{
    var zoneData = client.query(`select * from systems`);
    var waterings = client.query(`select * from waterings`);
    Promise.all([zoneData, waterings]).then((values)=>{
      res.json(values);
    });
  });

  //   client.query(`select * from waterings where actual_start_time >= '${req.body.startTime}' and actual_end_time <= '${req.body.endTime}'`).then((dBRes)=>{
  //     dBRes.rows.forEach((w)=>{
  //       w.duration = moment(w.actual_end_time).diff(w.actual_start_time, "milliseconds");
  //     });
  //     res.json(camelcaseKeys(dBRes.rows));
  //     client.release();
  //   }, (e)=>{
  //     res.json(e);
  //     client.release();
  //   }, (e)=>{
  //     res.json(e);
  //     client.release();
  //   });
  // }, (e)=>{
  //   res.json(e);
  //   client.release();
  // });
});



app.post('/dailyWaterings', (req, res)=>{
  pool.connect().then((client, done)=>{
    client.query(`select * from waterings where actual_start_time >= '${req.body.startTime}' and actual_end_time <= '${req.body.endTime}'`).then((dBRes)=>{
      dBRes.rows.forEach((w)=>{
        w.duration = moment(w.actual_end_time).diff(w.actual_start_time, "milliseconds");
      });
      res.json(camelcaseKeys(dBRes.rows));
      client.release();
    }, (e)=>{
      res.json(e);
      client.release();
    }, (e)=>{
      res.json(e);
      client.release();
    });
  }, (e)=>{
    res.json(e);
    client.release();
  });
});

//system_id, description, zone_number

app.get('/waterings', (req, res)=>{
  //TODO: this sux rewrite with async await
  pool.connect().then((client, done)=>{
    client.query(`select * from waterings inner join durations on waterings.duration_id = durations.did`).then((dBRes)=>{
      res.json(camelcaseKeys(dBRes.rows));
      client.release();
    }, (e)=>{
      res.json(e);
      client.release();
    }, (e)=>{
      res.json(e);
      client.release();
    });
  }, (e)=>{
    res.json(e);
    client.release;
  });
});

//TODO: put all routing in a seperate file
app.post('/waterings', (req, res)=>{
  pool.connect().then((client, done) => {
    client.query(`insert into durations (total_duration) values ( ${req.body.duration}) returning *`).then((durationDbRes)=>{
      let durationId = durationDbRes.rows[0].did;
      client.query(`insert into waterings (start_time, zones, duration_id, end_time, actual_start_time, actual_end_time) values ('${req.body.start}', '{3, 4}', '${durationId}', '${req.body.end}', '${req.body.start}', '${req.body.end}') returning *`).then((dbRes) => {
        res.json(dbRes.rows);
        client.release();
      }, (e)=>{
        res.json(e);
      });
    }, (e)=>{
      res.json(e);
    }, (e)=>{
      res.json(e);
    });
  });
});

app.get("/", function(req, res) {
  res.sendfile('index.html');
});

app.listen(5000, function() {
  console.log("Listening on 5000");
});
