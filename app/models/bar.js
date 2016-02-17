var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var BarSchema = new Schema({
    ID: {type: String, unique: true, required: true},
    numGoing: Number,
    usersGoing: [String]
});

var Bar = mongoose.model("Bar", BarSchema);

module.exports = Bar;