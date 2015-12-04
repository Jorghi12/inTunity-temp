var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var app = express();
var mongoose = require('mongoose');

var dbName = 'inTunity';

mongoose.connect('mongodb://localhost/' + dbName);

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
// var Doctor = require('./model/Doctor.js');
// var Event = require('./model/Event.js');

//routes
var router = express.Router();


router.post('/api/accounts', function (req, res, next) {



	console.log("about to post a user!!!");

	var newUser = new User({
                user_id: req.body.user_id,
                nickname: req.body.nickname,
                picture: req.body.picture,
                email: req.body.email,
                song: {
                        song_name: "",
                        song_album_pic: "",
                        song_url: ""
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

	  	userObj.song.song_title = req.body.song_title;
	  	userObj.song.song_url = req.body.song_url;
	  	userObj.song.song_album_pic = req.body.song_artwork;
	  	userObj.song.timeStamp = req.body.timeStamp;
	  	userObj.song.dayStamp = req.body.timeDay;

	    userObj.save(function(err) {
	    	if (err) {
	    		throw err;
	    	}	
    		console.log('successfully updated user song!');
    		res.sendStatus(200);
  		});	
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
