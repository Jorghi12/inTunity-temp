var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var User = new Schema({
	user_id: {type: String, unique: true },
	nickname: String,
	picture: String,
	email: String,
	url_username: String,
	song_history: [ObjectId],
	today_song: [ObjectId],
	saved_song: [ObjectId],
	friends: [ObjectId]
});



module.exports = mongoose.model('User', User);
