var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongHistory = new Schema({
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
	today_song: {
		song_title: String,
		song_album_pic: String,
		song_url: String,
		unix_time: String,
		track_id: String,
		song_duration: String
	},
	song_history: [SongHistory]

	
});

module.exports = mongoose.model('User', User);
