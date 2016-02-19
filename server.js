var express = require("express");
var mongoose = require("mongoose");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var path = require("path");
var yelp = require("node-yelp");

var react = require("react");
var reactDOM = require("react-dom");

var client = yelp.createClient({
  oauth: {
    "consumer_key": "-eSy_Sa6zYSHmhv7xNe-8Q",
    "consumer_secret": "gwGlGPYR7qt6CbwTHXnjnwfUJ1k",
    "token": "pvgzpYZ583XAqni_tXvOCgRp_ruObPyg",
    "token_secret": "f2Iw2GyYqBkbovS57WSux_ylh3s"
  }
})

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

// takes an array and an item and checks if the array contains the item
function contains(arr, item) {
  for(var i in arr) {
    if(arr[i] === item.toString()) {
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
app.post("/bar/get/:barName", function(req, res) {
  var barName = req.params.barName;
  
  var userLogged = req.cookies.userLogged || null;
  
  var numGoing = -1;
  var userGoing = -1;


  Bar.findOne({
    ID: barName
  }, function(err, doc) {
    if(err) throw err;
    if(doc) {
      numGoing = doc.numGoing;
      if(userLogged !== null) {
        if(contains(doc.usersGoing, userLogged)) {
          userGoing = 1;
        } else {
          userGoing = 0;
        }
      } else {
        userGoing = -1;
      }
      
      res.json({
        bar: doc,
        numGoing: numGoing,
        userGoing: userGoing
      })
    } else {
      numGoing = 0;
      if(userLogged) {
        userGoing = 0;
      } else {
        userGoing = -1;
      }
      res.json({
        bar: null,
        numGoing: numGoing,
        userGoing: userGoing
      })
    }
  })
  
})

// marks a user as attending a bar
// takes in a barname, the username is taken from cookies
// first Bar.numGoing is incremented and then userLogged is appended to Bar.usersGoing
// then the Bar.ID is appended to User.bars
app.post("/user/add/:barName", function(req, res) {
    var barName = req.params.barName;
    var userLogged = req.cookies.userLogged;
    
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
    
    res.sendStatus(200);
})

// unmarks a user as attending a bar
// takes in a barname in the url, the username is taken from cookies
// has to be removed from both the user.bars and the bar.usersGoing
// if this reduces bars.numGoing to 0, then remove the document
// no need to store data on a bunch of places that have 0 going
app.post("/user/remove/:barName", function(req, res) {
    var barName = req.params.barName;
    var userLogged = req.cookies.userLogged;
    console.log(barName);
    
    Bar.update({
      ID: barName
    }, {
      $inc: {
        numGoing: -1
      },
      $pull: {
        usersGoing: userLogged
      }
    }, function(err, doc) {
      if(err) throw err;
       Bar.findOne({
      ID: barName
    }, function(err, doc) {
        if(err) throw err;
        if(doc) {
          if(doc.numGoing === 0) {
            Bar.remove({
              ID: barName
            }, function(err, doc) {
              if(err) throw err;
            })
          }
        }
    })
    })
    
    User.update({
      username: userLogged
    }, {
      $pull: {
        bars: barName
      }
    }, function(err, doc) {
      if(err) throw err;
    })
    
    res.sendStatus(200);
})

/*
* /user/profile
* gets list of bars and some information on each bar that user has selected as attending
*/

app.get("/user/profile", function(req, res) {
    var userLogged = req.cookies.userLogged;
    
    User.findOne({
      username: userLogged
    }, function(err, doc) {
      if(err) throw err;
      res.json({
        bars: doc.bars
      })
    })
})

// makes a search for nearby bars in an area specified by the user
app.post("/user/search", function(req, res) {
    var search = req.body.searchQuery;
    
    client.search({
        term: "bars",
        location: search
    }).then(function (data) {
        var businesses = data.businesses;
        var location = data.region;
        
        res.json(businesses);
        
    });
    
    
});

app.post("/bar/search", function(req, res) {
  var search = req.body.searchQuery;
  
  client.business(search).then(function(data) {
    res.json(data);
  })
})

app.listen(process.env.PORT, process.env.IP);