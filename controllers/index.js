'use strict';

var express = require('express');
var _ = require('lodash');
var async = require('async');
var router = express.Router();
var bridge = require('../lib/bridge');
var db = require('../lib/db');

router.use('/settings', require('./settings'));

router.get('/', function (req, res, next) {
  bridge.api.lights(function(err, data) {
    if (err) {
      return next(err);
    }

    var templateData = {};
    templateData.colors = require('../lib/colors');
    templateData.lights = {};
    async.each(data.lights, function(light, callback){
      bridge.api.lightStatus(light.id, function(err, result){
        var dbLight = db('lights').find({id: light.id});
        light.state = (result.state.on) ? 'On' : 'Off';
        light.result = result;
        light.logs = bridge.lights[light.id].log;
        if (bridge.lights[light.id].timer) {
          light.timerTime = bridge.lights[light.id].timerTime.toString();
        }
        if (typeof dbLight === 'object' && dbLight.settings) {
          light.settings = dbLight.settings;
        } else {
          light.settings = {};
        }
        templateData.lights[light.id] = light;
        return callback();
      });
    }, function(){

      templateData.unassignedButtons = [];
      _.each(db('buttons').value(), function(button){
        if (button.light) {
          templateData.lights[button.light].button = button;
        } else {
          templateData.unassignedButtons.push(button);
        }
      });

      res.render('index', templateData);
    });

  });
});

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'));
  }
  var button;
  var light;
  if (req.body.cmd === 'associate-button') {
    button = db('buttons').find({mac: req.body.button});
    if (button) {
      button.light = req.body.light;
      return db.savePromise().then(function(){
        res.redirect('/');
      });
    }
  }
  if (req.body.cmd === 'timer-length') {
    light = db('lights').find({id: req.body.light});
    if (!light) {
      db('lights').push(
        { id: req.body.light,
          settings: {
            stayOnMinutes: req.body.minutes
          }
        }
      );
    } else {
      if (!light.settings) {
        light.settings = {};
      }
      light.settings.stayOnMinutes = req.body.minutes;
      return db.savePromise().then(function(){
        res.redirect('/');
      });
    }
  }
  if (req.body.cmd === 'default-color') {
    var rgb = [
      parseInt(req.body.color.substring(1,2), 16),
      parseInt(req.body.color.substring(3,4), 16),
      parseInt(req.body.color.substring(5,6), 16)
    ];
    light = db('lights').find({id: req.body.light});
    if (!light) {
      db('lights').push(
        { id: req.body.light,
          settings: {
            rgb: rgb,
            hex: req.body.color
          }
        }
      );
    } else {
      if (!light.settings) {
        light.settings = {};
      }
      light.settings.rgb = rgb;
      light.settings.hex = req.body.color;
    }
    return db.savePromise().then(function(){
      res.redirect('/');
    });
  }
  if (req.body.cmd === 'turn-on-keep-on') {
    req.log('Turning on light for ' + req.body.light);
    bridge.lights[req.body.light].turnOn();
  }
  if (req.body.cmd === 'turn-on-with-timer') {
    bridge.lights[req.body.light].turnOnWithTimer();
  }
  if (req.body.cmd === 'turn-off') {
    bridge.lights[req.body.light].turnOff();
  }

  res.redirect('/');
});

module.exports = router;
