var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var app = express();
var mongoose = require('mongoose');

var dbName = 'inTunity';

mongoose.connect('mongodb://localhost:27017/' + dbName);

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

var whitelist = ['http://localhost:8100'];
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
var SongHistory = require('./model/SongHistory.js');
var location = require('./model/location.js');

// var Event = require('./model/Event.js');

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
 //    });

    // location.find({  }, function(err, loc) {
	   //    if (err) {
	   //    	throw err;
	   //    }

	   //    console.log("delete");
	   //      // delete him
	   //    location.remove(function(err) {
	   //    if (err) {
	   //         throw err;
	   //    }
	   //    console.log('Location successfully deleted!');
	 
	   //    });
    // });



router.post('/api/accounts', function (req, res, next) {
	console.log("about to post a user!!!");




	var newUser = new User({
	    user_id: req.body.user_id,
	    nickname: req.body.nickname,
	    picture: req.body.picture,
	    email: req.body.email,
	    today_song: {
            song_name: "",
            song_album_pic: "",
            song_url: "",
			unix_time: "",
			track_id: "",
			song_duration: ""
	    }
    });

	 User.findOne({user_id: req.body.user_id}, function (err, userObj) {
	    if (err) {
	      console.log(err);
	      res.sendStatus(500);
	    } else if (userObj) {
	      console.log('Found:', userObj);
	      res.sendStatus(500);
	    } else {
	      console.log('User not found!');
	        newUser.save(function(err) {
	           if (err) {
	                 throw err;
	           }     else {
	                 console.log('User created!');
	                 res.sendStatus(200);
	           }
	         });
	    }
	  });
});



router.get('/api/accounts/' , function (req, res, next) {
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
	  	console.log(todayTime);


	  	for (var i = 0; i < userObj.length; i++) {

	  		if(userObj[i].today_song.song_url != '') {
	  			
		  		console.log("time difference");
		  		console.log(todayTime - userObj[i].today_song.unix_time);

		  		// a diff of 600 is about 10 min
		  		if (todayTime - userObj[i].today_song.unix_time >= 86400) {
		  			console.log("past expiration time");

		  			userObj[i].today_song.song_title = '';
		  			userObj[i].today_song.song_url = '';
		  			userObj[i].today_song.song_album_pic = '';
		  			userObj[i].today_song.unix_time = '';
		  			userObj[i].today_song.track_id= '';
		  			userObj[i].today_song.song_duration= '';


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
	}).sort({'today_song.unix_time': -1});

});







router.post('/api/accounts/updateSong' , function (req, res, next) {


	User.findOne({user_id: req.body.user_id}, function(err, userObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(userObj) {

	  	console.log("updating...");
	  	userObj.today_song.song_title = req.body.song_title;
	  	userObj.today_song.song_url = req.body.song_url;
	  	userObj.today_song.song_album_pic = req.body.song_artwork;
	  	userObj.today_song.unix_time = req.body.unix_time;
	  	userObj.today_song.track_id = req.body.track_id;
	  	userObj.today_song.song_duration = req.body.song_duration;


	  	var song = new SongHistory({
		   	song_title: req.body.song_title,
			song_album_pic: req.body.song_artwork,
			song_url: req.body.song_url,
			unix_time: req.body.unix_time,
			track_id: req.body.track_id,
			song_duration: req.body.song_duration
	    });


	  	userObj.song_history.push(song);

	    userObj.save(function(err, obj) {
	    	if (err) {
	    		throw err;
	    	}

	    	var locObj = new location({
		    	state: req.body.state,
		    	city: req.body.city,
		    	song_id: obj["song_history"][obj["song_history"].length - 1].id
		    });


	    	locObj.save(function(err) {
		    	if (err) {
		    		throw err;
		    	}	
	    		res.sendStatus(200);
	  		});	

	  		console.log(locObj);

  		});	

  		console.log("Updated user after posting song" + userObj);
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