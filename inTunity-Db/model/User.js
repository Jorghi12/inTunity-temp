var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	user_id: {type: String, unique: true },
	nickname: String,
	picture: String,
	email: String,
	song: {
		song_title: String,
		song_album_pic: String,
		song_url: String,
		timeStamp: String,
		dayStamp: String,

	}
	
});

module.exports = mongoose.model('User', User);