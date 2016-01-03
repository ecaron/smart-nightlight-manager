'use strict';

var pkg = require('./package');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');
var logger = require('./lib/logger');

require('./lib/bridge');

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

var app = express();
var port = process.env.PORT || 3000;

app.set('views', __dirname + '/views');
nunjucks.configure('views', {
  autoescape: true,
  express: app
});
app.set('view engine', 'html');

app.use(cookieParser('secret'));
app.use(session({
  secret: 'secret',
  cookie: { maxAge: 60000 },
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

app.use(function (req, res, next) {
  req.log = function(type, message, meta) {
    if (typeof meta !== 'object') {
      meta = {};
    }
    meta.method = req.method;
    meta.url = req.originalUrl;
    meta.ip = req.ip;
    if (typeof logger[type] !== 'undefined') {
      logger[type](message, meta);
    } else {
      logger.error('Failed attempt to invoke logger with type "' + type + '"');
      logger.info(message, meta);
    }
  };
  next();
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(require('morgan')('combined', { 'stream': logger.stream }));
app.use(require('./controllers'));

app.use(function(err, req, res, next) {
  //jshint unused:false
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(function(req, res, next) {
  //jshint unused:false
  res.status(404).send('Sorry cant find that!');
});

app.listen(port, function () {
  console.log('Started %s. Listening on port %d', pkg.name, port);
});
