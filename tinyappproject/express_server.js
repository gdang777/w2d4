const express = require('express') ;
const app = express();
app.set('view engine','ejs');
const port = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var cookieParser = require('cookie-parser')

app.use(cookieParser());

function generateRandomString() {
    let string = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 6; i++){
        string += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  return string;
}
function checkUserFromEmail(email){
    for (var userId in users){
       var user = users[userId];
       var checkEmail = user.email 
       if(checkEmail === email){
           return user;
       }
    }
}
function urlsForUserId(passedUserId){
    var newObj ={};
    for(var entry in urlDatabase){
        if(urlDatabase[entry].userId === passedUserId){
            newObj[entry] = urlDatabase[entry].longUrl;
            // console.log("newobj check in the function", newObj)
        }
    }
    return newObj;
}
var users = { 
    "userRandomID": {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    },
   "user2RandomID": {
      id: "user2RandomID", 
      email: "user2@example.com", 
      password: "dishwasher-funk"
    }
  };

var urlDatabase = {
    "b2xVn2":{ longUrl:"http://www.lighthouselabs.ca", userId:"fjwj45"},
    "9sm5xk": {longUrl:"http://www.google.com", userId:"jsdfh3"},
    "asdfas":{ longUrl: "http://zombo.com", userId:"6f6fh3"}
};

app.get("/",(req, res)=>{
    res.send("Hello there!");
});
app.get("/urls.json",(req, res)=> {
    res.json(urlDatabase);
});
app.get('/urls', (req,res)=> {
    let verifiedCookie = req.cookies["user_id"];
    // console.log("Checking for cookies",verifiedCookie);
    if(verifiedCookie){
        // console.log("Checking if statement in cookies");
        //Get the urls for that user.
        let resultUrls = urlsForUserId(verifiedCookie);
        // console.log("checking for newObj values" ,resultUrls);
        let templatevars = {
            user: users[req.cookies.user_id],
            urls: resultUrls
        };
        // console.log("these are templatevars in GET/urls:" ,templatevars);
        res.render('urls_index',templatevars);
    }else{
        // console.log("cookiechecker -else");
        res.redirect('/login');
    } 
});
app.get("/urls/new", (req, res) => {
    const user = users[req.cookies.user_id] 
    var templateVars = {
        user: user   
    }
    if(!user){ 
        res.redirect("/login");
    }else {
        // console.log("test",users[req.cookies["user_id"]] );
        res.render("urls_new", templateVars );
    } 
});

app.get("/urls/:id", (req, res) => {

    if(req.cookies["user_id"]){
        if(urlDatabase[req.params.id].userId === req.cookies["user_id"]){
            //everything ok
            const shortURL = req.params.id;
            const longURL = urlDatabase[shortURL].longUrl;
            // console.log("Long Url from  GETurl/:id", longURL )
            let templateVars = { 
                user:users[req.cookies.user_id],
                shortURL: shortURL, longURL: longURL
            };
            res.render("urls_show", templateVars);  
        
        } else{
            res.send("Sorry this url does not belongs to you");
        }
    }else{
        //redirect him to the page
        // console.log("we are in the else part");
        let longURL = urlDatabase[req.params.id].longUrl;
        res.redirect(longURL);
        //res.send("sorry you are not logged in");
    }
});  
app.get("/u/:shortURL",(req,res)=> {
    const shortURL = req.params.shortURL;
    // console.log(shortURL,"test1");
    const longUrl = urlDatabase[shortURL];
    // console.log(longUrl, 'Test2');
    res.redirect(longUrl);
});
// Get/Login endpoint
app.get('/login', (req,res)=> {
    var templateVars = {
        user: users[req.cookies["user_id"]]     
    }
    // console.log(templateVars,"Test");
    res.render('newlogin', templateVars);
    
});
//handling the delete request from the delete button
app.post('/urls/:id/delete', (req,res)=> {
    if (urlDatabase[req.params.id].userId === req.cookies.user_id){
        delete urlDatabase[req.params.id];
        res.redirect('/urls');
    }else { 
        res.send("You are not authorized to delete this link, Please hit the back button");
    }
});
//
app.post('/urls', (req,res)=>{
    var shortURL = generateRandomString();
    var longURL = req.body.longURL
    // console.log(req.body.longURL);
    urlDatabase[shortURL] = {longUrl: longURL, userId : req.cookies.user_id}
    // console.log("test", urlDatabase);
    res.redirect('/urls');
});
//handling the delete request from the delete button
app.post('/urls/:id/update', (req, res)=>{

   // "b2xVn2":{ longUrl:"http://www.lighthouselabs.ca", userId:"fjwj45"},

    let tempData = {
        longUrl: req.body.longUrl,
        userId : req.cookies["user_id"]
    }
    urlDatabase[req.params.id] = tempData;
    res.redirect('/urls');
});
//
app.post('/login',(req,res)=> {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        // console.log(email ,password , "test");
        res.status(400).send("Email or password could not be left blank");
        return;
    }

    // At this point we have an email and password from the frontend.
    // We also have the function checkUserFromEmail()
    //  1) is this a valid email?
    //  2) is the password the right password for that email?
    //  3) suppose all that's true.  what's their user_id?
    //  4) set the cookie and redirect
    var user = checkUserFromEmail(email);
    if (user) {
        if(user.password === password){
            res.cookie("user_id",user.id);
            // console.log(req.body.user,"test");
            res.redirect('/urls');
        }else {
            res.status(403).send("Password is not valid.");
        }
    }else {
        res.status(403).send("User is not registered");
    }
});

//
app.post('/logout',(req,res) => {
    res.clearCookie("user_id");
    res.redirect('/urls');
});
//
app.get('/Hello',(req,res)=> {
    res.send("<html><body>Hello <b>World</b></body<html>\n");
});
//
app.post('/register', (req,res) => {
    const email = req.body.email;
    const password = req.body.password;
    if(!email || !password) {
        res.status(400).send("Email or password could not be left blank");
        return;
    } 
    if(checkUserFromEmail(email)) {
        res.status(403).send('Email already registered. Please try another email');
    }else {
        var userRandomId = generateRandomString();
        users[userRandomId] = {
            id: userRandomId,
            email: email,
            password: password
        };
    res.cookie("user_id",userRandomId);
    res.redirect('/urls');
    }
});

// registration page
app.get('/register', (req,res) => {
    res.render('registration');
});

// server listening
app.listen(port, () =>{
    console.log(`Example app listening on port ${port}!`);
});