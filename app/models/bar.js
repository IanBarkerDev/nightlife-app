var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var BarSchema = new Schema({
    ID: {type: Number, unique: true, required: true},
    numGoing: Number,
    userGoing: [String]
});

var Bar = mongoose.model("Bar", BarSchema);

module.exports = Bar;