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

//api_key=V1RYZWZCKQTDXGWAB&format=json&id=SOCZMFK12AC468668F&bucket=audio_summary
//Pull Song info from EchoNest
app.get('/secured/EchoNest/PullSongInfo', function(req, res) {
 request({
      url: "http://developer.echonest.com/api/v4/song/profile", //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method,
      qs: {api_key: req.query["api_key"],id: req.query["song_id"], format:"json", bucket:"song_type"} //"audio_summary"
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {result: data});
        }
      }
  });
});


app.get('/secured/EchoNest/PullGenreList', function(req, res) {
 request({
      url: "http://developer.echonest.com/api/v4/song/search", //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method,
      qs: {api_key: req.query["api_key"]}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {result: data});
        }
      }
  });
});



app.get('/secured/EchoNest/PullGenreArtist', function(req, res) {
  console.log("hit");
 request({
      url: "http://developer.echonest.com/api/v4/artist/profile", //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method,
      qs: {api_key: req.query["api_key"], name: req.query["artist"], bucket: "genre", format:"json"  }
  }, function(error, response, body){
       
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {result: data});
        }
      }
  });
});






//Search a song on EchoNest
app.get('/secured/EchoNest/SearchSong', function(req, res) {
 request({
      url: "http://developer.echonest.com/api/v4/song/search", //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method,                          Allowing artist makes results more accurate. But if our artist query is wrong.. we end up with nothing.
      qs: {api_key: req.query["api_key"],title: req.query["title"], bucket: "audio_summary"}//,artist: req.query["artist"]}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {result: data});
        }
      }
  });
});

// search for a particular artist
app.get('/secured/artist/search-genre/spotify', function(req, res) {
 request({
      url: "https://api.spotify.com/v1/search", //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method,
      qs: {q: req.query["artist"], type: "artist"}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {result: data});
        }
      }
  });
});


// search for a particular track
app.get('/secured/search/track/spotify', function(req, res) {
 request({
      url: "https://api.spotify.com/v1/search", //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method,
      qs: {query: req.query["title"], type: "track"}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {result: data});
        }
      }
  });
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

// load all of a user's friends on his or her's follow list
app.get('/secured/account/loadFollowUsers', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/account/loadFollowUsers', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method,
	  qs: {user_id: req.query["user_id"]}
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
        if (response.statusCode == 200) {
          var data = JSON.parse(response.body);
          res.send(200, {followers: data});
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

// getting a specific user (USING THE URL_USERNAME) .. Helps for profile url routing.
// this is mainly used for profile.js
app.get('/secured/account/url_username', function(req, res) {
  request({
      url: process.env.DATABASE + '/api/account/url_username', //URL to hit
      headers: {
      'Content-Type': 'application/json'
      },
      method: 'GET', //Specify the method
      qs: {url_username: req.query["url_username"]}
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
          console.log(data);
		  res.send(200, {likes: data["current_likes"], response: data["response"]});
      }
  });
});

//Favorite a song
app.post('/secured/account/id/favorite/song/id', function(req, res) {
  request({
    url: process.env.DATABASE + "/api/account/id/favorite/song/id", //URL to hit
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
          console.log(data);
		  res.send(200, {favorites: data["current_favorites"], response: data["response"]});
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


//Remove Follower from List
app.post('/secured/account/id/removefollower', function(req, res) {
  request({
    url: process.env.DATABASE + "/api/account/id/removefollower", //URL to hit
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


var port = process.env.PORT || 3001;

http.createServer(app).listen(port, function (err) {
  console.log('listening in http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:' + port);
});