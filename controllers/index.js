'use strict';

var express = require('express');
var async = require('async');
var router = express.Router();
var bridge = require('../lib/bridge');
var buttons = require('../lib/buttons');

router.use('/settings', require('./settings'));
router.use('/users', require('./users'));

router.get('/', function (req, res, next) {
  bridge.api.lights(function(err, data) {
    if (err) {
      return next(err);
    }

    var templateData = {};
    templateData.lights = data.lights;
    res.render('index', templateData);
  });
});

module.exports = router;
