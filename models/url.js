var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var urlSchema = new Schema({
	title: String,
	video_url: String,
	likes: Array
},{timestamps: true})

var ModelClass = mongoose.model('url',urlSchema)
module.exports = ModelClass;