var express = require("express");
var mongoose = require("mongoose");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var path = require("path");

mongoose.connect("mongodb://admin:mushroommanagegoatsalad@ds043615.mongolab.com:43615/nightlife");

var User = require("./app/models/user.js");
var Bar = require("./app/models/bar.js");

var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(cookieparser());
app.use(express.static(path.resolve(__dirname, 'client'), {redirect: false}));

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

// login
app.post("/login", function(req, res) {
  var un = req.body.username;
  var pw = req.body.password;
  
  User.findOne({
    username: un
  }, function(err, doc) {
    if(err) throw err;
    if(doc === null) {
      res.json({
        ret: "username"
      })
    } else {
      if(doc.password !== pw) {
        res.json({
          ret: "password"
        })
      } else {
        res.cookie("userLogged", un);
        res.json({
          ret: "success"
        })
      }
    }
  })
})

//signup
app.post("/signup", function(req, res) {
  var un = req.body.username;
  var pw = req.body.password;
  var em = req.body.email;
  var pwC = req.body.passwordConfirm;
  
  if(pw !== pwC) {
    res.json({
      ret: "confirm"
    })
  } else {
  
    User.findOne({
      $or: [
       {username: un},
       {email: em}
      ]
    }, function(err, doc) {
        if(err) throw err;
        if(doc !== null) {
         res.json({
            ret: "existing"
          })
       } else {
          var user = new User({
            username: un,
            password: pw,
            email: em,
            bars: []
          })
          
          user.save();
          res.cookie("userLogged", un);
          res.json({
            ret: "success"
          })
        }
    })
  }
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

// takes a username from cookies and returns the User.bars array for client side to search
app.get("/user/bars", function(req, res) {
    var un = req.cookie("userLogged");
    
    User.findOne({
      username: un
    }, function(err, doc) {
        if(err) throw err;
        res.json({
          data: doc.bars
        })
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
      }, $pull: {
        usersGoing: userLogged
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

/*
* /user/profile
* gets list of bars and some information on each bar that user has selected as attending
*/

app.get("/user/profile", function(req, res) {
    var userLogged = req.cookie.userLogged;
})

app.listen(process.env.PORT, process.env.IP);