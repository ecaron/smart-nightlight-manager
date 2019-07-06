'use strict';

var pkg = require('./package');
var express = require('express');
var session = require('express-session');
var flash = require('connect-flash');
var nunjucks = require('nunjucks');
var path = require('path');

var bodyParser = require('body-parser');
var logger = require('./lib/logger');
var colorWatcher = require('./lib/color-watcher');

// Required early on see we can just shut it all down if there's
// no Hue to connect to
require('./lib/bridge');

process.on('uncaughtException', function (err) {
  if (process.env.NODE_ENV === 'production') {
    console.log(err);
  } else {
    throw err;
  }
});

var app = express();
var port = process.env.PORT || 3000;

app.set('views', path.resolve(__dirname, 'views'));
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: (process.env.NODE_ENV !== 'production')
});
app.set('view engine', 'html');

app.use(session({
  secret: 'secret',
  cookie: { maxAge: 60000 },
  resave: true,
  saveUninitialized: true
}));
app.use(flash());

app.use('/scripts/timepicker/', express.static('node_modules/timepicker'));
app.use('/scripts/moment/', express.static('node_modules/moment'));
app.use(express.static('public'));

app.use(function (req, res, next) {
  res.locals.success_messages = req.flash('success');
  res.locals.error_messages = req.flash('error');
  next();
});

app.use(function (req, res, next) {
  req.log = function (type, message, meta) {
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require('morgan')('combined', { 'stream': logger.stream }));
app.use(require('./controllers'));

app.use(function (err, req, res, next) {
  // jshint unused:false
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(function (req, res, next) {
  // jshint unused:false
  res.status(404).send('Sorry cant find that!');
});

app.listen(port, function () {
  console.log('Started %s. Listening on port %d', pkg.name, port);
});

// Once each minute, make sure that if the light is on
// and that light has a color schedule, the scheduled color
// is used
setTimeout(function () {
  setInterval(colorWatcher, 60 * 1000);
}, (60 - (new Date()).getSeconds()) * 1000);
colorWatcher();
