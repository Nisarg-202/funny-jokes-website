//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const nodemailer = require('nodemailer');



const app = express();

app.use(session({
  secret: 'this is a jokes website.',
  resave: false,
  saveUninitialized: false
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://nisarg:Nkp@Nkp23@cluster0-x2a77.mongodb.net/jokesDB', {useNewUrlParser: true, useUnifiedTopology: true});


app.set("view engine", "ejs");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  content: [String],
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://glacial-anchorage-70961.herokuapp.com/auth/google/jokes"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://glacial-anchorage-70961.herokuapp.com/auth/facebook/jokes"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/jokes',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/main");
  });


  app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['user_friends', 'manage_pages'] }));

  app.get('/auth/facebook/jokes',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect("/main");
    });

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/register", function(req ,res) {
  res.render("register");
});

app.get("/login", function(req ,res) {
  res.render("login");
});

app.get("/main", function(req ,res) {
  if(req.isAuthenticated()) {
      res.render("main");
  } else {
    res.redirect("/login");
  }

});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.post("/uploadjoke", function(req, res) {

  User.findById(req.user.id, function(err, result) {
    if(err) {
      console.log(err);
    } else {
      if(result) {
        result.updateOne({$push: {content: req.body.joke}}, function(err) {
          if(err) {
            console.log(err);
          } else {
            res.redirect("/main");
          }
        });
      }
    }
  });

});



app.post("/register", function(req, res) {


var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nisargprajapati202@gmail.com',
    pass: 'Nkp@Nkp23'
  }
});

var mailOptions = {
  from: 'nisargprajapati202@gmail.com',
  to: req.body.username,
  subject: "Daily Funny 😂😂 Jokes.",
  html: "<h1>Welcome to daily funny jokes 🤣🤣🤣.</h1><br> <p>In this website you can read a daily new joke and if you want to add your joke so add a jokes in a given box.</p> <br> <p>Thank you.</p>"
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log("mail sent successfully.");
  }
});

  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/main");
      });
    }
  });
});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
  if (err) {
     console.log(err);
   } else {
     passport.authenticate("local")(req, res, function() {
       res.redirect("/main");
     });
   }

});
});



app.listen(process.env.PORT || 3000, function() {
  console.log("server is running on port 3000.");
});
