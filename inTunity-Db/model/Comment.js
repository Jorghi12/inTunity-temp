var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;



var Comment = new Schema({
	content: String,
	unix_time: String,
	user_id: ObjectId
	
});

module.exports = mongoose.model('Comment', Comment);