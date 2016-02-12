var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Song = new Schema({
	song_title: String,
	song_album_pic: String,
	song_url: String,
	unix_time: String,
	track_id: String,
	song_duration: String,
	likes: Number,
	who_posted: ObjectId,
	comments: {type: Array,'default': []},
	who_liked: {type: Array,'default': []}
});

module.exports = mongoose.model('Song', Song);