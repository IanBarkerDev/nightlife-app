var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: String,
    password: String,
    email: String,
    bars: [Number]
});

var User = mongoose.model("User", UserSchema);

module.exports = User;