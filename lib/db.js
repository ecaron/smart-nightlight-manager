'use strict';
var low = require('lowdb');
var FileSync = require('lowdb/adapters/FileSync')
var path = require('path');

var dbFile = path.resolve(__dirname, '..', 'config/db.json');
var adapter = new FileSync(dbFile);
var db = low(adapter);

module.exports = db;
