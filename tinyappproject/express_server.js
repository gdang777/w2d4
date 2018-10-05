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

const users = { 
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
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xk": "http://www.google.com",
    "asdfas": "http://zombo.com",
};

app.get("/",(req, res)=>{
    res.send("Hello there!");
});
app.get("/urls.json",(req, res)=> {
    res.json(urlDatabase);
});
app.get('/urls', (req,res)=> {
    let templatevars = {
        user: users[req.cookies["user_id"]],
        urls: urlDatabase
    };
    res.render('urls_index',templatevars);
});
app.get("/urls/new", (req, res) => {
    var templateVars = {
        user: users[req.cookies["user_id"]]   
    }
    console.log("test",users[req.cookies["user_id"]] );
    res.render("urls_new", templateVars );
});
app.get("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    const longURL = urlDatabase[shortURL];
    let templateVars = { 
        username:req.cookies["username"],
        shortURL: shortURL, longURL: longURL
    };
    res.render("urls_show", templateVars);  
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
    res.render('newlogin', templateVars);
});
//handling the delete request from the delete button
app.post('/urls/:id/delete', (req,res)=>{
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
});
//
app.post('/urls', (req,res)=>{
    var shortURL = generateRandomString();
    var longURL = req.body.longURL
    // console.log(req.body.longURL);
    urlDatabase[shortURL] = longURL ;
    res.redirect('/urls');
    
});
//handling the delete request from the delete button
app.post('/urls/:id/update', (req, res)=>{
    urlDatabase[req.params.id] = req.body.longUrl
    res.redirect('/urls');
});
//
app.post('/login',(req,res)=>{
    res.cookie("user_id",req.body.user);
    res.redirect('/urls');
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
    const username = req.body.email;
    const password = req.body.password

    if(!username || !password) {
        res.status(400).send("Username or password could not be left blank");
        return;
    }    
//   const username = req.body.email ;
    const userRandomId = generateRandomString();
    users[userRandomId] = {
        id: userRandomId,
        email: username,
        password: password
    };
    console.log(users ,"Test");
    res.cookie("user_id",userRandomId);
    res.redirect("/urls");
});
// registration page
app.get('/register', (req,res) => {
    // res.send("lets register");
    const templateVars = {username: req.cookies["username"]};
    res.render('registration', templateVars);
});
// server listening
app.listen(port, () =>{
    console.log(`Example app listening on port ${port}!`);
});