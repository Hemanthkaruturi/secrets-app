//jshint esversion:6

require('dotenv').config()
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const findOrCreate = require("mongoose-findorcreate")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const port = 3000

// Connect to mongodb
const url = process.env.MONGOURL
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect(url);

// create user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
}, (accessToken, refreshToken, profile, cb) => {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
)

const User = new mongoose.model("user", userSchema)

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user)
  })
})


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });


app.get("/login", (req, res) => {
  res.render("login")
})

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user, (err) => {
    if(err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req,res,() => {
        res.redirect("/secrets")
      })
    }
  })
})

app.get("/logout", (req,res) => {
  req.logout((err) => {
    if(err) {
      console.log(err);
    } else {
      res.redirect("/")
    }
  })

})

app.get("/register", (req, res) => {
  res.render("register")
})

app.get("/secrets", (req,res) => {
  if(req.isAuthenticated()) {
    res.render("secrets")
  } else {
    res.render("login")
  }
})

app.post("/register", (req, res) => {
  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req,res,() => {
        res.redirect("/secrets")
      })
    }
  })
})

app.listen(port, function() {
  console.log("Server started on port 3000");
});
