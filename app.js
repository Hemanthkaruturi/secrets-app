//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const port = 3000

// Connect to mongodb
const url = process.env.MONGOURL
mongoose.connect(url);

// create user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

const secret = process.env.SECRET
userSchema.plugin(encrypt, {secret:secret, encryptedFields: ['password']});

const User = new mongoose.model("user", userSchema)


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home")
})

app.get("/login", (req, res) => {
  res.render("login")
})

app.post("/login", (req, res) => {
  // get email and password
  email = req.body.username
  password = req.body.password
  User.findOne({
    email: email
  }, (err, foundUser) => {
    if (!err) {
      if (foundUser != null) {
        if (foundUser.password === password) {
          res.render("secrets")
        } else {
          res.send("Incorrect password")
        }
      } else {
        res.send("user not found!")
      }
    } else {
      res.send(err)
    }
  })
})

app.get("/register", (req, res) => {
  res.render("register")
})

app.post("/register", (req, res) => {

  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  })

  newUser.save().then(() => {
    res.render("secrets")
  })
})

app.listen(port, function() {
  console.log("Server started on port 3000");
});
