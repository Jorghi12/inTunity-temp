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

module.exports = mongoose.model('Song', Song);