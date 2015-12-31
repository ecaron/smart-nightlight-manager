'use strict';
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var nunjucks = require('nunjucks');
var favicon = require('serve-favicon');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');

app.engine('nunj', nunjucks.render);
app.set('view engine', 'nunj');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

if (app.get('env') === 'development') {
  app.locals.pretty = true;
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
