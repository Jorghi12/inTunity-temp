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
// var Event = require('./model/Event.js');

//routes
var router = express.Router();


router.post('/api/accounts', function (req, res, next) {
	console.log("about to post a user!!!");

	  // User.find({  }, function(err, user) {
   //    if (err) {
   //            throw err;
   //    }

   //    console.log("delete");
   //      // delete him
   //     User.remove(function(err) {
   //    if (err) {
   //            throw err;
   //    }
   //    console.log('User successfully deleted!');
   //    res.send(200);
   //    });
   //  });


	var newUser = new User({
	    user_id: req.body.user_id,
	    nickname: req.body.nickname,
	    picture: req.body.picture,
	    email: req.body.email,
	    today_song: {
	            song_name: "",
	            song_album_pic: "",
	            song_url: "",
	            created_at_time: "",
				created_at_day: "",
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

	  	console.log(userObj.length);


	  	// update the timer in here after expiration
	  	// if expired, make that entry null in the db

	  	var today = new Date();

	  	// unix time 
	  	var todayTime = today.getTime()/1000;
	  	console.log(todayTime);

	  	var months = {
	  		"Dec" : 11,
	  		"Nov" : 10,
	  		"Oct" : 9,
	  		"Sep" : 8,
	  		"Aug" : 7,
	  		"Jul" : 6,
	  		"Jun" : 5,
	  		"May" : 4,
	  		"Apr" : 3,
	  		"Mar" : 2,
	  		"Feb" : 1,
	  		"Jan" : 0
	  	}

	  	for (var i = 0; i < userObj.length; i++) {
	  		var time = userObj[i].today_song.created_at_time;
	  		var day = userObj[i].today_song.created_at_day;

	  		var year = parseInt(day.substring(7));
	  		var month = months[(day.substring(0,3))];
	  		var comma = day.indexOf(",");
	  		var day = parseInt(day.substring(4,comma));


	  		// getting all the individual time components
	  		var colon = time.indexOf(":");
	  		var space = time.indexOf(" ");
	  		var hours = parseInt(time.substring(0,colon));
	  		var min = parseInt(time.substring(colon + 1,space));
	  		var am_pm = time.substring(space + 1);

	  		if (am_pm == "PM") {
	  			hours = hours + 12;
	  		}


	  		var song_created_at_date = new Date(year, month, day, hours, min).getTime()/1000;
	  		console.log(song_created_at_date);


	  		console.log(todayTime - song_created_at_date);

	  		// a diff of 600 is about 10 min
	  		if (todayTime - song_created_at_date >= 86400) {
	  			console.log("past expiration time");

	  			userObj[i].today_song.created_at_time = '';
	  			userObj[i].today_song.created_at_day = '';
	  			userObj[i].today_song.song_title = '';
	  			userObj[i].today_song.song_url = '';
	  			userObj[i].today_song.song_album_pic = '';


	  			userObj[i].save(function(err) {
	           		if (err) {
	             		throw err;
	           		} else {
	                 	console.log('song got updated');
	           		}
	         	});
	  		}
	  	}

	  	console.log(userObj);

	  	res.send(userObj);
	  } 
	});
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
	  	userObj.today_song.created_at_time = req.body.timeStamp;
	  	userObj.today_song.created_at_day = req.body.timeDay;


	  	var song = new SongHistory({
		   	song_title: req.body.song_title,
			song_album_pic: req.body.song_artwork,
			song_url: req.body.song_url,
			created_at_time: req.body.timeStamp,
			created_at_day: req.body.timeDay
	    });

	  	userObj.song_history.push(song);

	    userObj.save(function(err) {
	    	if (err) {
	    		throw err;
	    	}	
    		res.sendStatus(200);
  		});	


  		console.log("Updated user after posting song" + userObj);
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
