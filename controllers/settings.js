'use strict';

var express = require('express');
var router = express.Router();
var Comment = require('../models/comment');

router.get('/', function (req, res) {
  res.render('settings');
});

router.get('/:id', function (req, res) {
  Comment.get(req.params.id, function (err, comment) {
    if (err) {
      res.status(500);
      return res.render('error', {error: err});
    }
    res.render('comments/comment', {comment: comment});
  });
});

module.exports = router;
