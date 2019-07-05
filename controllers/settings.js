'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('settings');
});

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'));
  }
  switch (req.body.cmd) {
  }
});

module.exports = router;
