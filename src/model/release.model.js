var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	sanitizeJson = require('mongoose-sanitize-json'),
	constant = require('../config/app.constant');

var releaseSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	releaseDate: {
		type: Date,
		required: true
	}
});

releaseSchema = releaseSchema.plugin(sanitizeJson);
module.exports = mongoose.model('Release', releaseSchema);
