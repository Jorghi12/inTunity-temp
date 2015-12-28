var http = require('http');
var express = require('express');
var cors = require('cors');
var app = express();
var jwt = require('express-jwt');
var dotenv = require('dotenv');

var request = require('request');

dotenv.load();

var authenticate = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_CLIENT_ID
});


app.configure(function () {

 // Request body parsing middleware should be above methodOverride
  app.use(express.bodyParser());
  app.use(express.urlencoded());
  app.use(express.json());

  app.use('/secured', authenticate);
  app.use(cors());

  app.use(app.router);
});


app.get('/ping', function(req, res) {
  res.send(200, {text: "All good. You don't need to be authenticated to call this"});
});

app.get('/secured/ping', function(req, res) {
  res.send(200, {text: "All good. You only get this message if you're authenticated"});
});


// adding a new account
app.post('/secured/account', function(req, res) {
  request({
    url: 'http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3005/api/accounts/', //URL to hit
    method: 'POST', //Specify the method
    headers: {
      'Content-Type': 'application/json'
    },
    body: req.body["data"]
  }, function(error, response, body) {
      if(error) {
          console.log("error in logging in");
          console.log(error);
      } else {
          console.log("successfully added a user " + response.statusCode);
          res.send(response.statusCode);
      }
  });
});

// getting all the accounts
app.get('/secured/accounts', function(req, res) {
  request({
      url: 'http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3005/api/accounts/', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET' //Specify the method,
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {songs: data});
        }
      }
  });
});



// this method is used for posting a song
app.post('/secured/songs', function(req, res) {
  request({
    url: "http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3005/api/accounts/updateSong", //URL to hit
    method: 'POST', //Specify the method
    headers: {
      'Content-Type': 'application/json'
    },
    body: req.body["data"]
  }, function(error, response, body) {
      console.log("updating song...");
      if(error) {
          console.log(error);
      } else {
          console.log(response.body);
          res.send(response.statusCode);
      }
  });
});

// getting the different locations
app.get('/secured/location', function(req, res) {
  request({
      url: 'http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3005/api/location/', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET' //Specify the method
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {location: data});
        }
      }
  });
});

// getting a specific user
app.get('/secured/specificUser', function(req, res) {
  console.log(req.query["id"]);
  request({
      url: 'http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3005/api/specificUser', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method
      qs: {user_id: req.query["id"]}
  }, function(error, response, body){
    console.log(req.query["id"]);

      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          console.log(data);
          res.send(200, {user:data});
        }
      }
  });
});







var port = process.env.PORT || 3001;

http.createServer(app).listen(port, function (err) {
  console.log('listening in http://localhost:' + port);
});