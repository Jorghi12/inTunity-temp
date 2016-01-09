var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var app = express();
var mongoose = require('mongoose');

var ObjectId = require('mongoose').Types.ObjectId;

var dotenv = require('dotenv');
dotenv.load();

var dbName = 'inTunity';

mongoose.connect(process.env.MONGO + dbName);

app.use(session({ 
	secret: 'inTunity',
	resave: false,
	saveUninitialized: false,
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		ttl: 24 * 60 * 60 //1 day
	})
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

var whitelist = [process.env.WHITELIST];
var cors_options = {
	origin: function (origin, callback) {
		var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
		callback(null, originIsWhitelisted);
	}
};

//Server settings
app.all('/api/*', cors(cors_options));
app.set('port', 3005);

var User = require('./model/User.js');
var Song = require('./model/Song.js');
var location = require('./model/location.js');
var Comment = require('./model/Comment.js');


//routes
var router = express.Router();


// User.find({  }, function(err, user) {
//       if (err) {
//       	throw err;
//       }

//       console.log("delete");
//         // delete him
//       User.remove(function(err) {
//       if (err) {
//            throw err;
//       }
//       console.log('User successfully deleted!');

//       });
// });

// location.find({  }, function(err, loc) {
//       if (err) {
//       	throw err;
//       }

//       console.log("delete");
//         // delete him
//       location.remove(function(err) {
//       if (err) {
//            throw err;
//       }
//       console.log('Location successfully deleted!');
 
//       });
// });



router.post('/api/account', function (req, res, next) {

	User.findOne({user_id: req.body.user_id}, function (err, userObj) {
	    if (err) {
	      console.log(err);
	      res.sendStatus(500);
	    } else if (userObj) {
	      console.log('Found:', userObj);
	      res.sendStatus(500);
	    } else {
	      console.log('User not found!');


      	  // making sure that each url_username is unique
      	  User.find({nickname: req.body.nickname}, function (err, result) {
      		if (result.length == 0) {
      			var newUser = new User({
				    user_id: req.body.user_id,
				    nickname: req.body.nickname,
				    picture: req.body.picture,
				    email: req.body.email,
				    url_username: req.body.url_username
			    });

      			newUser.save(function(err) {
		           if (err) {
		           	 throw err;
		           } else {
	                 console.log('User created!');
	                 res.sendStatus(200);
		           }
		         });

      		} else {
      			// username already exists so add +1 to end
      			var newUser = new User({
				    user_id: req.body.user_id,
				    nickname: req.body.nickname,
				    picture: req.body.picture,
				    email: req.body.email,
				    url_username: req.body.url_username + (result.length + 1).toString()
			    });

      			newUser.save(function(err) {
		           if (err) {
		           	 throw err;
		           } else {
	                 console.log('User created!');
	                 res.sendStatus(200);

		           }
		        });
      		}
      	  });     		
	    }
	 });
});


// get the whole entire accounts
// mainly used for main feed
router.get('/api/account/' , function (req, res, next) {

	User.find({}, function(err, userObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(userObj) {

	  	// update the timer in here after expiration
	  	// if expired, make that entry null in the db
	  	var today = new Date();

	  	// unix time 
	  	var todayTime = today.getTime()/1000;

	  	for (var i = 0; i < userObj.length; i++) {
	  		if(userObj[i].today_song.length > 0) {

	
		  		// a diff of 600 is about 10 min
		  		//86400 is one day
		  		if (todayTime - userObj[i].today_song[0].unix_time >= 32140800) {		  		
		  			userObj[i].today_song.shift();
		  			userObj[i].save(function(err) {
		           		if (err) {
		             		throw err;
		           		} else {
		                 	console.log('song got updated');
		           		}
		         	});
		  		}
	  		}
	  	} // end of for loop

	  	res.send(userObj);
	  } 
	})

});







router.post('/api/account/id/song' , function (req, res, next) {

	User.findOne({user_id: req.body.user_id}, function(err, userObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(userObj) {

	  	var song = new Song({
		   	song_title: req.body.song_title,
			song_album_pic: req.body.song_artwork,
			song_url: req.body.song_url,
			unix_time: req.body.unix_time,
			track_id: req.body.track_id,
			song_duration: req.body.song_duration
	    });

	




	  	userObj.song_history.unshift(song);

	  	if (userObj.today_song.length == 0) {
	  		userObj.today_song.push(song);
	  	} else {
	  		userObj.today_song.shift();
	  		userObj.today_song.push(song);
	  	}
	  

	    userObj.save(function(err, obj) {
	    	if (err) {
	    		throw err;
	    	}


	    	if (req.body.locationFlag == true) {
	    		var locObj = new location({
			    	state: req.body.state,
			    	city: req.body.city,
			    	song_id: obj["song_history"][0].id
		    	});
		    	locObj.save(function(err) {
			    	if (err) {
			    		throw err;
			    	}	
	
		  		});	
	    	}
	    	res.sendStatus(200);
	    
  		});	
	  } 
	});
});	




// retrieving all the locations
router.get('/api/location/' , function (req, res, next) {
	location.find({}, function(err, locationObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(locationObj) {
	  	console.log(locationObj);
	  	res.send(locationObj);
	  } 
	});
});


//getting a specific user
router.get('/api/account/id/' , function (req, res, next) {
	User.findOne({user_id:req.query["user_id"] }, function(err, userObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(userObj) {
	  	res.send(userObj);
	  } 
	});
});

// deleting a specific song 
router.delete('/api/account/id/song' , function (req, res, next) {
	User.findOne({user_id: req.query["user_id"]}, function(err, userObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if (userObj) {
	  	
	  	for (var i = 0; i < userObj["song_history"].length; i++) {
	  		if (userObj["song_history"][i].id == ObjectId(req.query["song_id"])) {
	  			userObj["song_history"].splice(i, 1);
	  		}
	  	}

	  	if (userObj["today_song"].length == 1) {
	  		if (userObj["today_song"][0].id == ObjectId(req.query["song_id"])) {
	  			userObj["today_song"].shift();
	  		}

	  		if (userObj["song_history"].length > 0 && userObj["today_song"][0].id != ObjectId(req.query["song_id"]) ) {
	  			userObj["today_song"][0] = userObj["song_history"][0];
	  		}
	  	}


	  	userObj.save(function(err) {
	    	if (err) {
	    		throw err;
	    	}	
		});	
	  }
	});
	res.sendStatus(200);	
});








app.use(router);

//Create the server
var server = app.listen(app.get('port'), function () {
	console.log('Express server listening on port ' + server.address().port);
});

app.use(function (req, res) {
	var resp = {};
	resp.error = "Not Supported.";
	res.status(404).json(resp);
});