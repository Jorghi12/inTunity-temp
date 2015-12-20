var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var location = new Schema({
	state: String,
	city: String,
	latitude: String,
	longitude: String,
	song_id: String
});

module.exports = mongoose.model('location', location);