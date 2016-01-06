var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var Comment = new Schema({
	content: String,
	unix_time: String,
	user_id: String
	
});

module.exports = mongoose.model('Comment', Comment);