'use strict';

var hue = require('node-hue-api');
var sprintf = require('sprintf-js').sprintf;
var dash_button = require('node-dash-button');
var moment = require('moment');

var hex2rgb = require('./hex2rgb');
var logger = require('./logger');
var db = require('./db');

var bridgeInfo = db('bridge').first();
var _ = require('lodash');
var defaultStayOnMinutes = 60;

if (!bridgeInfo) {
  console.warn('Missing config/db.json does not contain bridge information. Did you forget to run "npm setup"?');
  process.exit(1);
}

if (typeof bridgeInfo !== 'object' || !bridgeInfo.ip || !bridgeInfo.username) {
  console.warn('config.bridge.json does not contain an object with "ip" and "username". Did you forget to run "npm setup"?');
  process.exit(1);
}

exports.HueApi = hue.HueApi;
exports.lightState = hue.lightState;
exports.api = new exports.HueApi(bridgeInfo.ip, bridgeInfo.username);
exports.lightLog = {};
exports.lights = {};
exports.api.lights(function(err, data) {
  _.each(data.lights, function(light){
    exports.lights[light.id] = {
      id: light.id,
      timer: false,
      timerTime: false,
      addLog: function(message) {
        if (this.log.length > 20) {
          this.log.shift();
        }
        this.log.push('[' + (new Date()).toString() + '] ' + message);
        logger.info(message);
      },
      log: [],
      turnOn: function(){
        var self = this;
        this.addLog(sprintf('Turning on light %d.', this.id));
        var light = db('lights').find({id: self.id});
        var lightSettings = {};
        var lightColorSchedule = {};
        var lightColor = '000000';
        if (typeof light !== 'undefined') {
          if (typeof light.settings !== 'undefined') {
            lightSettings = light.settings;
            if (lightSettings.color) {
              lightColor = lightSettings.color;
            }
          }
          if (typeof light.colorSchedule !== 'undefined') {
            var curDate = new Date();
            _.each(light.colorSchedule, function(schedule){
              if (moment(schedule.start, 'h:ma') <= curDate && moment(schedule.end, 'h:ma') >= curDate) {
                lightColor = schedule.color;
              }
            });
          }
        }

        var state = exports.lightState.create().on();
        state.brightness(lightSettings.brightness ? lightSettings.brightness : 0);
        state.rgb(hex2rgb(lightColor));
        exports.api.setLightState(self.id, state, function (err, lights) {
          //jshint unused:false
          if (err) throw err;
        });
      },
      turnOff: function(skipConsole){
        var self = this;

        if (self.timer) {
          clearTimeout(self.timer);
          self.timer = false;
        }
        exports.api.setLightState(this.id, {on: false}, function(err, result) {
          //jshint unused:false
          if (err) throw err;
          if (!skipConsole) {
            self.addLog(sprintf('Turning off light %d.', self.id));
          }
        });
      },
      turnOnWithTimer: function(){
        var self = this;
        var light = db('lights').find({id: self.id});
        var lightSettings = {};
        if (typeof light !== 'undefined' && typeof light.settings !== 'undefined') {
          lightSettings = light.settings;
        }
        var stayOnMinutes = defaultStayOnMinutes;
        if (typeof lightSettings === 'object' && lightSettings.stayOnMinutes > 0) {
          stayOnMinutes = lightSettings.stayOnMinutes;
        }
        self.timerTime = new Date((new Date()).getTime() + stayOnMinutes * 60 * 1000);
        this.turnOn();
        this.timer = setTimeout(function(){
          self.turnOff(true);
          self.addLog(sprintf('%d minutes reached, turning off light %d.', stayOnMinutes, self.id));
        }, stayOnMinutes * 60 * 1000);
      }
    };
  });
});


var buttons = [];
_.each(db('buttons').value(), function(button){
  if (button.light) {
    buttons.push(button.mac);
  }
});

if (!process.env.DISABLE_BUTTON) {
  var dash = dash_button(buttons);

  dash.on('detected', function(dash_id){
    var button = db('buttons').find({mac: dash_id});
    if (typeof button !== 'object' || !button.light) return;
    var lightId = button.light;
    var light = exports.lights[lightId];
    exports.api.lightStatus(lightId, function(err, result){
      if (!result || !result.state) return;
      light.addLog(sprintf('Button pushed for light %d', lightId));
      if (result.state.on) {
        light.turnOff();
      } else {
        light.turnOnWithTimer();
      }
    });
  });
}
