'use strict';

var express = require('express');
var routes = require('./routes');
var nunjucks = require('nunjucks');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

app.set('port', process.env.PORT || 3000);

nunjucks.configure('views', {
  autoescape: true,
  express: app
});
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

if (app.get('env') === 'development') {
  app.locals.pretty = true;
}

app.get('/', routes.index);

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
