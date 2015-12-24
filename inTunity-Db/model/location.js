var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var location = new Schema({
	state: String,
	city: String,
	song_id: String
});

module.exports = mongoose.model('location', location);