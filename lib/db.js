'use strict';
var low = require('lowdb');
var path = require('path');

var dbFile = path.resolve(__dirname, '..', 'config/db.json');
var db = low(dbFile);

module.exports = db;
