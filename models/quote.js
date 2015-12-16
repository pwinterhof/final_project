var mongoose = require('mongoose');

var quoteSchema = new mongoose.Schema({
	quotes: Array,
	name: String,
	change: String,
	percent_change: String,
	created_at: {type: Date, default: Date.now},
	updated_at: {type: Date, default: Date.now}
});

var Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote

