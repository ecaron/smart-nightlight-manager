'use strict';

var _ = require('lodash');
var timeCheck = require('./time-check');
var rgb = require('../node_modules/node-hue-api/hue-api/rgb');

var bridge = require('./bridge');
var db = require('./db');
var hex2rgb = require('./hex2rgb');

module.exports = function () {
  bridge.api.lights(function (err, data) {
    if (err) {
      console.warn(err);
      return;
    }

    var curDate = new Date();
    _.each(data.lights, function (light) {
      bridge.api.lightStatus(light.id, function (err, result) {
        if (err) {
          throw err;
        }

        var lightConfig = db.get('lights').find({ id: light.id }).value();
        var newColor = false;
        var intendedState = 'asis';
        var lightBrightness = '10';
        if (typeof lightConfig !== 'undefined' && typeof lightConfig.colorSchedule !== 'undefined') {
          _.each(lightConfig.colorSchedule, function (schedule) {
            if (timeCheck(curDate, schedule.start, schedule.end)) {
              newColor = rgb.convertRGBtoXY(hex2rgb(schedule.color));
              lightBrightness = schedule.brightness;
              if (typeof schedule.state !== 'undefined') intendedState = schedule.state;
            }
          });
        }
        if (result.state.on && intendedState === 'asis') {
          var currentColor = result.state.xy;

          if (newColor === false) {
            return;
          }
          if (Math.floor(newColor[0] * 10) === Math.floor(currentColor[0] * 10) && Math.floor(newColor[1] * 10) === Math.floor(currentColor[1] * 10)) {
            return;
          }
          var state = bridge.lightState.create().xy(newColor[0], newColor[1]);
          if (typeof lightBrightness === 'undefined') {
            state.brightness(10);
          } else {
            state.brightness(lightBrightness);
          }

          bridge.api.setLightState(light.id, state, function (err, lights) {
            // jshint unused:false
            if (err) {
              throw err;
            }
          });
        } else if (result.state.on && intendedState === 'off') {
          bridge.lights[light.id].turnOff();
        } else if (!result.state.on & intendedState === 'on') {
          bridge.lights[light.id].turnOn();
        }
      });
    });
  });
};
