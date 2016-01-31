'use strict';

var express = require('express');
var db = require('../lib/db');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('settings');
});

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'));
  }
  switch (req.body.cmd) {
    case 'add-button':

      db('buttons').push(
        { mac: req.body.mac,
          name: req.body.name
        }
      );

      return db.savePromise().then(function () {
        req.flash('success', 'Button has been successfully added to your system!');
        res.redirect('/');
      });
  }
});

module.exports = router;
