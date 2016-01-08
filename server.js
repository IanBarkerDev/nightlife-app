var express = require("express");
var mongoose = require("mongoose");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var path = require("path");

mongoose.connect("mongodb://localhost:27017");

var User = require("./app/models/user.js");
var Bar = require("./app/models/bar.js");

var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(cookieparser());
app.use(express.static(path.resolve(__dirname, 'client'), {redirect: false}));

app.set("views", "./views");
app.set("view engine", "jade");