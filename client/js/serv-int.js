
// takes a username and password and returns either "password" if password is incorrect or "success" on successful login
function userLogin(un, pw) {
    $.ajax({
        url: "/login",
        type: "post",
        dataType: "json",
        data: {
            username: un,
            password: pw
        },
        
        success: function(data) {
            switch(data.ret) {
                case "username": alert("Username not found");
                case "password": alert("Password does not match one found on file");
                case "success": alert("Logged in");
                default: break;
            }
        }
    })
}

// takes a username, email, password, and confirmatin password
// if password !== confirmation password then error on client side and no server request sent
// returns "existing" if username already found, 
// "success" if user is now signed up, or 
// "confirm" in the event that for some reason the server was still requested despite the passwords not matching
function userSignup(un, em, pw, pwC) {
    if(pw !== pwC) {
        alert("Passwords do not match");
    } else {
        $.ajax({
            url: "/signup",
            type: "post",
            dataType: "json",
            data: {
                username: un,
                password: pw,
                email: em,
                passwordConfirm: pwC
            },
            
            success: function(data) {
                switch(data.ret) {
                    case "confirm": alert("Passwords do not match (server)");
                    case "existing": alert("Username or email already taken");
                    case "success": alert("Signed up");
                    default: break;
                }
            }
        })
    }
}

// takes a search input, needs to be regex'd into zipcode or city
function userSearch(search) {
    console.log(search);
    search = search.replace(" ", "+");
    $.ajax({
        url: "https://api.yelp.com/v2/search",
        dataType: "jsonp",
        data: {
            term: "bars",
            location: search
        },
        success: function(data) {
            console.log(data);
        }
    })
}