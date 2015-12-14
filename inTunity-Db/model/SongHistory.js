var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongHistory = new Schema({
	song_title: String,
	song_album_pic: String,
	song_url: String,
	unix_time: String
});

module.exports = mongoose.model('SongHistory', SongHistory);