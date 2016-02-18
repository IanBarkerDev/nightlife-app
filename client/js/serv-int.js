
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
                break;
                case "password": alert("Password does not match one found on file");
                break;
                case "success": document.cookie = "userLogged=" + un + "; Path=/; expires=Thu, 01 Jan 2970 00:00:00 UTC;";
                break;
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
                    break;
                    case "existing": alert("Username or email already taken");
                    break;
                    case "success": document.cookie = "userLogged=" + un + "; Path=/; expires=Thu, 01 Jan 2970 00:00:00 UTC;";
                    break;
                    default: break;
                }
            }
        })
    }
}

// user logout deletes the logged in cookie and refreshes page
function userLogout() {
    document.cookie = "userLogged=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.pathname = "/";
}

// takes no params and returns the bars the logged in user is currently signed up to attend
function userProfile() {
    $.ajax({
        url: "/user/profile",
        type: "get",
        
        success: function(data) {
            $(".profile-results").empty();
            $.each(data.bars, function(index, val) {
                console.log(val);
                var html = '<p>' + val + '</p>'
                $(".profile-results").append(html);
            })
        }
    })
}

// takes a search input, needs to be regex'd into zipcode or city
function userSearch(search) {
    search = search.replace(" ", "+");
    $.ajax({
        url: "/user/search",
        type: "post",
        dataType: "json",
        data: {
            searchQuery: search
        },

        success: function(data) {
            $.each(data, function(index, val) {
                $(".search-results").empty();
                $.ajax({
                    url: "/bar/" + val.id,
                    type: "post",
                    dataType: "json",
                    
                    success: function(rtn) {
                        var userGoing = "";
                        if(rtn.userGoing === 1) {
                            userGoing = '<div class="plus">' +
                                            '<p class="minus">' +
                                                '-' +
                                            '</p>' +
                                        '</div>';
                        } else if (rtn.userGoing === 0) {
                            userGoing = '<div class="plus">' +
                                            '<p class="add">' +
                                                '+' +
                                            '</p>' +
                                        '</div>';
                        } else {
                            userGoing = '<div class="plus">' +
                                            '<p class="login-plus">' +
                                                '+' +
                                            '</p>' +
                                        '</div>';
                        }
                        
                        var html = '<div class="bar-box" id="' + val.id + '">' + 
                            '<div class="bar-information">' +
                                '<img class="bar-img" src="' + val.image_url + '" alt="Bar Img">' +
                                '<div class="bar-information-2">' +
                                    '<a href="' + val.url + '" class="bar-name">' + val.name + '</a>' +
                                    '<p class="bar-address">' + val.location.display_address + '</p>' +
                                    '<p class="bar-phone">' + val.phone + '</p>' +
                                    '<div class="bar-review">' +
                                        '<span class="bar-num-review">' + val.review_count + ' Reviews</span>' +
                                        '<img class="bar-star-review" src="' + val.rating_img_url_small + '" alt="Number of Stars">' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            userGoing +
                            '<div class="number">' +
                                '<p>' +
                                    rtn.numGoing +
                                '</p>' +
                            '</div>' +
                        '</div>';
                        
                        $(".search-results").append(html);
                    }
                })
            
            })
        }
    })
                $(".search-results").css("display", "block");
            $(".search-results").css("animation", "enlarge 1s linear forwards");
}

function addBar(barName) {
    if(parseCookies(document.cookie, "userLogged") !== null) {
        $.ajax({
            url: "/user/add/" + barName,
            type: "post",
    
            success: function(data) {
                var num = $("#" + barName + " .number p").html();
                num = +num;
                num ++;
                $("#" + barName + " .number p").text(num);
                
                switchPlus(barName, 1);
            }
        })
    
    }
}

function removeBar(barName) {
    $.ajax({
        url: "/user/remove/" + barName,
        type: "post",
        
        success: function(data) {
            var num = $("#" + barName + " .number p").html();
            num = +num;
            num --;
            $("#" + barName + " .number p").text(num);
            
            switchPlus(barName, 2);
        }
    })
}

function parseCookies(cookies, str) {
    var arr = cookies.split(";");
    for(var s in arr) {
        var arr2 = arr[s].split("=");
        if(arr2[0] === str) {
            return arr[1];
        }
    }
    
    return null;
}

/*
@param bar: barName
@param num: 1 = to minus; 2 = to add
*/
function switchPlus(bar, num) {
    
    var add = '<p class="add"> + </p>';
    var sub = '<p class="minus"> - </p>';
    
    var $plus = $("#" + bar + " .plus");
    $plus.empty();
    
    switch(num) {
        case 1: $plus.append(sub);
        break;
        case 2: $plus.append(add);
        break;
        default: break;
    }
}

function closeModals() {
    $(".modals").css("display", "none");
    $("#login").css("display", "none");
    $("#signup").css("display", "none");
    $("#profile").css("display", "none");
}