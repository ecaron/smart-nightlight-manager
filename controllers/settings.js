'use strict';

var express = require('express');
var router = express.Router();
var db = require('../lib/db');

router.get('/', function (req, res) {
  res.render('settings');
});

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'));
  }
  switch (req.body.cmd) {
    case 'add-button':
      req.flash('success', 'Default color has been successfully set for the light!');
      light = db.get('lights').find({ id: req.body.light }).value();
      db.get('lights').push(
        { id: req.body.light,
          settings: {
            color: req.body.color
          }
        }
      ).write();
    break;
  }
  res.redirect('/');
});

module.exports = router;
