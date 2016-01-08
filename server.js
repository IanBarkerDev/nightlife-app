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

app.set("views", "./views");
app.set("view engine", "jade");


function contains(arr, item) {
  for(var i in arr) {
    if(i === item) {
      return true;
    }
  }
  return false;
}

// render the base page
app.get("/", function(req, res) {
  res.render("index");
})

// takes a url with a barname attached
// returns how many people are going to the bar and if the user is going or not
/*
usergoing:
1 = going
0 = not going
-1 = no user logged in
*/
app.post("/bar/:barName", function(req, res) {
  var barName = req.params.barName;
  
  var userLogged = req.cookie.userLogged;
  
  var numGoing = -1;
  var userGoing = -1;
  
  Bar.findOne({
    ID: barName
  }, function(err, doc) {
    if(err) throw err;
    if(doc) {
      numGoing = doc.numGoing;
      if(userLogged) {
        if(contains(doc.usersGoing, userLogged)) {
          userGoing = 1;
        } else {
          userGoing = 0;
        }
      } else {
        userGoing = -1;
      }
    } else {
      numGoing = 0;
      if(userLogged) {
        userGoing = 0;
      } else {
        userGoing = -1;
      }
    }
  })
  
  res.json({
    numGoing: numGoing,
    userGoing: userGoing
  })
  
})


// marks a user as attending a bar
// takes in a barname, the username is taken from cookies
// first Bar.numGoing is incremented and then userLogged is appended to Bar.usersGoing
// then the Bar.ID is appended to User.bars
app.post("/user/add/:barName", function(req, res) {
    var barName = req.params.barName;
    var userLogged = req.cookie.userLogged;
    
    Bar.findOneAndUpdate({
      ID: barName
    }, {
      $inc: {
        numGoing: 1
      },
      $push: {
        usersGoing: userLogged
      }
    }, 
    {upsert: true}, 
    function(err, doc) {
        if(err) throw err;
    })
    
    User.update({
      username: userLogged
    }, {
      $push: {
        bars: barName
      }
    }, function(err, doc) {
      if(err) throw err;
    })
})

// unmarks a user as attending a bar
// takes in a barname in the url, the username is taken from cookies
// has to be removed from both the user.bars and the bar.usersGoing
// if this reduces bars.numGoing to 0, then remove the document
// no need to store data on a bunch of places that have 0 going
app.post("/user/remove/:barName", function(req, res) {
    var barName = req.params.barName;
    var userLogged = req.cookie.userLogged;
    
    Bar.findOneAndUpdate({
      ID: barName
    }, {
      $dec: {
        numGoing: 1
      }, {
        $pull: {
          usersGoing: userLogged
        }
      }
    }, function(err, doc) {
      if(err) throw err;
    })
    
    Bar.findOne({
      ID: barName
    }, function(err, doc) {
        if(err) throw err;
        if(doc.numGoing === 0) {
          Bar.remove({
            ID: barName
          }, function(err, doc) {
            if(err) throw err;
          })
        }
    })
})

app.listen(process.env.PORT, process.env.IP);