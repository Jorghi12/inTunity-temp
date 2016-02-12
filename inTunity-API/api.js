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
    url: process.env.DATABASE + '/api/account/', //URL to hit
    method: 'POST', //Specify the method
    headers: {
      'Content-Type': 'application/json'
    },
    body: req.body["data"]
  }, function(error, response, body) {

      if(error) {
          console.log(error);
      } else {
          res.send(response.statusCode);
      }
  });
});

// getting all the accounts
app.get('/secured/account', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/account/', //URL to hit
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


// Get all accounts that match given search name
// used for searching a particular account
app.get('/secured/account/id/search', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/account/id/search', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method,
	  qs: {searchString: req.query["searchString"], currentUser: req.query["userID"], suggestedFriends: req.query["suggestedFriends"]}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {suggestions: data});
        }
      }
  });
});



// this method is used for posting a song
app.post('/secured/account/id/song', function(req, res) {

  request({
    url: process.env.DATABASE + "/api/account/id/song", //URL to hit
    method: 'POST', //Specify the method
    headers: {
      'Content-Type': 'application/json'
    },
    body: req.body["data"]
  }, function(error, response, body) {
      if(error) {
          console.log(error);
      } else {
          res.send(response.statusCode);
      }
  });
});

// getting the different locations
app.get('/secured/location', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/location/', //URL to hit
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
// this is mainly used for profile.js
app.get('/secured/account/id', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/account/id', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method
      qs: {user_id: req.query["id"]}
  }, function(error, response, body){

      if(error) {
        console.log(error);
      } else {
        if (response.statusCode == 200) {
          console.log("success");
          var data = JSON.parse(response.body);
          res.send(200, {user:data});
        } else if (response.statusCode == 205){
          console.log("user does not exist");
          res.send(205);
        }
      }
  });
});


// getting a list of specific users
// this is mainly used for profile.js
app.get('/secured/account/idBatch', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/account/idBatch', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method
      qs: {users: req.query["users"]}
  }, function(error, response, body){

      if(error) {
        console.log(error);
      } else { 
        if (response.statusCode == 200) {
          console.log("success");
          var data = JSON.parse(response.body);
          res.send(200, {user:data});
        } else if (response.statusCode == 205){
          console.log("user does not exist");
          res.send(205);
        }
      }
  });
});


//getting a specific song
app.get('/secured/song/id', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/song/id', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method
      qs: {song_id: req.query["song_id"]}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {user:data, userNumber: req.query["userNum"]});
        }
      }
  });
});

//getting a multiple songs
app.get('/secured/song/id_multiple', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/song/id_multiple', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method
      qs: {song_ids: req.query["song_ids"]}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {user:data});
        }
      }
  });
});




// deleting a song on your own account
app.delete('/secured/account/id/song/id', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/account/id/song/id',
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'DELETE', //Specify the method
      qs: {user_id: req.query["user_id"], song_id: req.query["song_id"]}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          res.send(200);
        }
      }
  });
});



// this method is used for liking a certain song
app.post('/secured/account/id/likes/song/id', function(req, res) {
  request({
    url: process.env.DATABASE + "/api/account/id/likes/song/id", //URL to hit
    method: 'POST', //Specify the method
    headers: {
      'Content-Type': 'application/json'
    }, 
    body: req.body["data"]

  }, function(error, response, body) {
      if(error) {
          console.log(error);
      } else {
          var data = JSON.parse(response.body);
		  res.send(200, {likes: data["current_likes"]});
      }
  });
});


//Add Follower to List
app.post('/secured/account/id/addfollower', function(req, res) {
  request({
    url: process.env.DATABASE + "/api/account/id/addfollower", //URL to hit
    method: 'POST', //Specify the method
    headers: {
      'Content-Type': 'application/json'
    }, 
    body: req.body["data"]

  }, function(error, response, body) {
      if(error) {
          console.log(error);
      } else {
          var data = JSON.parse(response.body);
		  //data["userAlreadyInList"], want to notify the View (HTML page) that we're already friends with this user
		  res.send(200, {userAlreadyInList: data["userAlreadyInList"]});
      }
  });
});

//Pull Profile Information
app.post('/secured/account/id/profileInfo', function(req, res) {
  request({
    url: process.env.DATABASE + "/api/account/id/profileInfo", //URL to hit
    method: 'POST', //Specify the method
    headers: {
      'Content-Type': 'application/json'
    }, 
    body: req.body["data"]

  }, function(error, response, body) {
      if(error) {
          console.log(error);
      } else {
          var data = JSON.parse(response.body);
		  //data["userAlreadyInList"], want to notify the View (HTML page) that we're already friends with this user
		  res.send(200, {followers: data["num_followers"], following: data["num_following"]});
      }
  });
});

var port = process.env.PORT || 3001;

http.createServer(app).listen(port, function (err) {
  console.log('listening in http://localhost:' + port);
});