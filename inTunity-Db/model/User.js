var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Song = new Schema({
	song_title: String,
	song_album_pic: String,
	song_url: String,
	unix_time: String,
	track_id: String,
	song_duration: String
});

var User = new Schema({
	user_id: {type: String, unique: true },
	nickname: String,
	picture: String,
	email: String,
	url_username: String,
	song_history: [Song],
	today_song: [Song]

	
});

module.exports = mongoose.model('User', User);
