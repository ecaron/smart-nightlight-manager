'use strict';

var express = require('express');
var _ = require('lodash');
var async = require('async');
var router = express.Router();
var bridge = require('../lib/bridge');
var db = require('../lib/db');
var colorSchedule = require('../lib/color-schedule');

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

        light.settings = {};
        if (typeof dbLight === 'object' && dbLight.settings) {
          light.settings = dbLight.settings;
        }

        light.colorSchedule = {};
        if (typeof dbLight === 'object' && dbLight.colorSchedule) {
          light.colorSchedule = dbLight.colorSchedule;
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
  switch (req.body.cmd) {
    case 'associate-button':
      button = db('buttons').find({mac: req.body.button});
      if (button) {
        button.light = req.body.light;
        return db.savePromise().then(function(){
          req.flash('success', 'Button has been successfully associated with the light!');
          res.redirect('/');
        });
      }
      break;

    case 'create-color-schedule':
      return colorSchedule.create(db, req, res);
      break;

    case 'update-color-schedule':
      return colorSchedule.update(db, req, res);
      break;

    case 'delete-color-schedule':
      return colorSchedule.delete(db, req, res);
      break;

    case 'timer-length':
      light = db('lights').find({id: req.body.light});
      req.flash('success', 'Timer has been successfully set for the light!');
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
      break;

    case 'default-color':
      req.flash('success', 'Default color has been successfully set for the light!');
      light = db('lights').find({id: req.body.light});
      if (!light) {
        db('lights').push(
          { id: req.body.light,
            settings: {
              hex: req.body.color
            }
          }
        );
      } else {
        if (!light.settings) {
          light.settings = {};
        }
        light.settings.hex = req.body.color;
      }
      return db.savePromise().then(function(){
        res.redirect('/');
      });
      break;

    case 'turn-on-keep-on':
      req.flash('success', 'Light has been turned on and will stay on!');
      req.log('Turning on light for ' + req.body.light);
      bridge.lights[req.body.light].turnOn();
      break;

    case 'turn-on-with-timer':
      req.flash('success', 'Light has been turned on and timer has been started!');
      bridge.lights[req.body.light].turnOnWithTimer();
      break;

    case 'turn-off':
      req.flash('success', 'Light has been turned off!');
      bridge.lights[req.body.light].turnOff();
      break;
  }

  res.redirect('/');
});

module.exports = router;
