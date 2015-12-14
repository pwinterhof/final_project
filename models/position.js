var mongoose = require('mongoose');

var positionSchema = new mongoose.Schema({
	ticker: String,
	share_count: Number,
	total_cost: Number,
	user: { type: mongoose.Schema.Types.ObjectId },
	created_at: {type: Date, default: Date.now},
	updated_at: {type: Date, default: Date.now}
});

var Position = mongoose.model('Position', positionSchema);

module.exports = Position

