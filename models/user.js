var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
	username: String,
	password_hash: String,
	money: { type: Number, default: 50000 },
	created_at: {type: Date, default: Date.now},
	updated_at: {type: Date, default: Date.now}
});

var User = mongoose.model('User', userSchema);

module.exports = User

