var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var location = new Schema({
	state: String,
	city: String,
	song_id: ObjectId,
	user_id: ObjectId
});

module.exports = mongoose.model('location', location);