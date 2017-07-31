var mongoose = require('mongoose')
var bcrypt =  require('bcryptjs')

mongoose.connect('')

var db = mongoose.connection


var UserSchema = mongoose.Schema({
	username: {
		type: String,
		index: true
	},
	password: {
		type: String
	},
	email: {
		type: String
	},
	name: {
		type: String
	}
})

var User = module.exports