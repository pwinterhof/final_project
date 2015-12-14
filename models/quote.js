var mongoose = require('mongoose');

var quoteSchema = new mongoose.Schema({
	quotes: Array,
	created_at: {type: Date, default: Date.now},
	updated_at: {type: Date, default: Date.now}
});

var Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote

