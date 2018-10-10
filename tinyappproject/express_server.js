const express = require('express');
const app = express();
app.set('view engine','ejs');
const port = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));

var cookieSession = require('cookie-session');

app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  
    // Cookie Options
    maxAge: 24 * 60 * 60 * 100
  }));
//-----------function to generate random string for shortURL and user id
function generateRandomString() {
    let string = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 6; i++){
        string += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  return string;
}
//-------------Email verifier function
function checkUserFromEmail(email){
    for (let userId in users){
       let user = users[userId];
       let checkEmail = user.email 
       if(checkEmail === email){
          return user;
       }
    }
}
//-------------function to get all the URLS for a specific user
function urlsForUserId(passedUserId){
    let newObj ={};
    for(let entry in urlDatabase){
        if(urlDatabase[entry].userId === passedUserId){
            newObj[entry] = urlDatabase[entry].longUrl;
        }
    }
    return newObj;
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

const urlDatabase = {
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
    let verifiedCookie = req.session.user_id;
    if(verifiedCookie){
        let resultUrls = urlsForUserId(verifiedCookie);
        let templatevars = {
            user: users[verifiedCookie],
            urls: resultUrls
        };
        res.render('urls_index',templatevars);
    }else {
        res.redirect('/login');
    } 
});
//-----------GET route fot urls/new
app.get("/urls/new", (req, res) => {
    const sessionCookie = req.session.user_id
    const user = users[sessionCookie]; 
    let templateVars = {
        user: user   
    }
    if(!user){ 
        res.redirect("/login");
    }else {
        res.render("urls_new", templateVars );
    } 
});
//--------------GET request for /urls/:id
app.get("/urls/:id", (req, res) => {
    if(req.session["user_id"]){
        if(urlDatabase[req.params.id] && urlDatabase[req.params.id].userId === req.session["user_id"]){
            const shortURL = req.params.id;
            const longURL = urlDatabase[shortURL].longUrl;
            let templateVars = { 
                user:users[req.session.user_id],
                shortURL: shortURL, longURL: longURL
            };
            res.render("urls_show", templateVars);  
        }else {
            res.send("Sorry this url does not belongs to you");
        }
    }else {
        let longURL = urlDatabase[req.params.id].longUrl;
        res.redirect(longURL);
    }
}); 
//---------------GET route for /u/:shortURL 
app.get("/u/:shortURL",(req,res)=> {
    const shortURL = req.params.shortURL;
    const longUrl = urlDatabase[shortURL].longUrl;
    res.redirect(longUrl);
});

//--------------- Get/Login endpoint
app.get('/login', (req,res)=> {
    let templateVars = {
        user: users[req.session.user_id]     
    }
    res.render('newlogin', templateVars);
});

//---------------handling the delete request from the delete button
app.post('/urls/:id/delete', (req,res)=> {
    if (urlDatabase[req.params.id].userId === req.session.user_id){
        delete urlDatabase[req.params.id];
        res.redirect('/urls');
    }else { 
        res.send("You are not authorized to delete this link, Please hit the back button");
    }
});
//---------------Post route for /urls
app.post('/urls', (req,res)=>{
    let shortURL = generateRandomString();
    let longURL = req.body.longURL
    urlDatabase[shortURL] = {longUrl: longURL, userId : req.session.user_id}
    res.redirect('/urls');
});
//--------------handling the delete request from the delete button
app.post('/urls/:id/update', (req, res)=>{
    let tempData = {
        longUrl: req.body.longUrl,
        userId : req.session.user_id
    }
    urlDatabase[req.params.id] = tempData;
    res.redirect('/urls');
});
//---------------Login route
app.post('/login',(req,res)=> {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        res.status(400).send("Email or password could not be left blank");
        return;
    }
    let user = checkUserFromEmail(email);
    if (user) {
        if(bcrypt.compareSync(password, user.password)){ // returns true
            req.session.user_id = user.id;
            res.redirect('/urls');
        }else {
            res.status(403).send("Username / Password is not valid.");
        }
    }else {
        res.status(403).send("User is not registered. Please click Register link");
    }
});

//
app.post('/logout',(req,res) => {
    req.session = null;
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
    const hashedPassword = bcrypt.hashSync(password ,10);
    if(!email || !password) {
        res.status(400).send("Email or password could not be left blank");
        return;
    } 
    if(checkUserFromEmail(email)) {
        res.status(403).send('Email already registered. Please try another email');
    }else {
        let userRandomId = generateRandomString();
        users[userRandomId] = {
            id: userRandomId,
            email: email,
            password: hashedPassword
        };
    req.session.user_id = userRandomId;
    res.redirect('/urls');
    }
});

//---------------- registration page
app.get('/register', (req,res) => {
    res.render('registration');
});

//-----------------server listening
app.listen(port, () =>{
    console.log(`Example app listening on port ${port}!`);
});