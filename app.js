require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const trimRequest = require('trim-request');
const connectToDatabase = require('./lib/mongoose');
connectToDatabase();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// apply trim
app.use(trimRequest.all);

app.get('/health', function(req, res, next) {
  // console.log("health", global.health);
  return res.status(200).send({data : global.health});
});

const productsRoute = require('./routes/products');

app.use('/products', productsRoute)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  return res.status(404).send({error: 'Route '+req.url+' not found'});
});

// 500 - Any server error
app.use(function (err, req, res, next) {
  console.log(err)
  let status = err.status || 500;
  let errMessage = err.message || "Internal server error";
  res.status(status).send({error : errMessage});
});

module.exports = app;