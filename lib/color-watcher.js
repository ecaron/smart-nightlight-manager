'use strict';

var _ = require('lodash');
var moment = require('moment');
var rgb = require('../node_modules/node-hue-api/hue-api/rgb');

var bridge = require('./bridge');
var db = require('./db');
var hex2rgb = require('./hex2rgb');

module.exports = function() {
  bridge.api.lights(function(err, data) {
    if (err) {
      return;
    }

    var curDate = new Date();
    _.each(data.lights, function(light){
      bridge.api.lightStatus(light.id, function(err, result){
        if (result.state.on) {
          var currentColor = result.state.xy;
          var lightConfig = db('lights').find({id: light.id});
          if (typeof lightConfig !== 'undefined' && typeof lightConfig.colorSchedule !== 'undefined') {
            var newColor = false;
            _.each(lightConfig.colorSchedule, function(schedule){
              if (moment(schedule.start, 'h:ma') <= curDate && moment(schedule.end, 'h:ma') >= curDate) {
                newColor = rgb.convertRGBtoXY(hex2rgb(schedule.color));
              }
            });

            if (newColor === false) {
              return;
            }
            if (Math.floor(newColor[0] * 10) === Math.floor(currentColor[0] * 10) && Math.floor(newColor[1] * 10) === Math.floor(currentColor[1] * 10)) {
              return;
            }
            var state = bridge.lightState.create().xy(newColor[0], newColor[1]);
            bridge.api.setLightState(light.id, state, function (err, lights) {
              //jshint unused:false
              if (err) throw err;
            });
          }
        }
      });
    });
  });
};
