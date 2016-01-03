'use strict';

var express = require('express');
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');

var app = express();
var port = process.env.PORT || 3000;

app.set('views', __dirname + '/views');
nunjucks.configure('views', {
  autoescape: true,
  express: app
});
app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('./controllers'));

app.listen(port, function() {
  console.log('Listening on port ' + port);
});