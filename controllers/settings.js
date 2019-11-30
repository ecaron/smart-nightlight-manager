'use strict';

const express = require('express');
const router = express.Router();
const db = require('../lib/db');

router.get('/', function (req, res) {
  res.render('settings');
});

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'));
  }
  switch (req.body.cmd) {
    case 'add-button':
      // req.flash('success', 'Default color has been successfully set for the light!');
      let maxEntry = db.get('lights').sortBy('id').reverse().take(1).value()[0];
      let newEntry = {
        id: String(parseInt(maxEntry.id) + 1),
        settings: {}
      };
      if (req.body.type === 'fastled') {
        newEntry.type = 'fastled';
        try {
          let newConfig = JSON.parse(req.body.config);
          if (!newConfig.name || !newConfig.ip) {
            return next(new Error('POST without a cmd'));
          }
          newEntry.settings = newConfig;
        } catch (e) {
          return next(e);
        }
      } else {
        return next(new Error('Unrecognized light type'));
      }
      db.get('lights').push(newEntry).write();
    break;
  }
  res.redirect('/');
});

module.exports = router;
