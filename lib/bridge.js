'use strict';

var hue = require('node-hue-api');
var sprintf = require('sprintf-js').sprintf;
var dash_button = require('node-dash-button');
var logger = require('./logger');
var db = require('./db');
var bridgeInfo = db('bridge').first();
var _ = require('lodash');
var defaultStayOnMinutes = 60;

if (!bridgeInfo) {
  console.warn('Missing config/db.json does not contain bridge information - Exiting!');
  process.exit(1);
}

if (typeof bridgeInfo !== 'object' || !bridgeInfo.ip || !bridgeInfo.username) {
  console.warn('config.bridge.json does not contain an object with "ip" and "username". Exiting');
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
        this.addLog(sprintf('Turning on light %d.', this.id));
        var lightSettings = db('lights').find({id: this.id}).settings;
        if (typeof lightSettings !== 'object') {
          lightSettings = {};
        }
        var state = exports.lightState.create().on();
        state.brightness(lightSettings.brightness ? lightSettings.brightness : 0);
        state.rgb(lightSettings.rgb ? lightSettings.rgb : [0, 0, 0]);
        exports.api.setLightState(this.id, state, function (err, lights) {
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
        var lightSettings = db('lights').find({id: self.id}).settings;
        var stayOnMinutes = defaultStayOnMinutes;
        if (typeof lightSettings === 'object' && lightSettings.stayOnMinutes > 0) {
          stayOnMinutes = lightSettings.stayOnMinutes;
        }
        self.timerTime = new Date((new Date()).getTime() + stayOnMinutes * 60 * 1000);
        self.turnOn();
        self.timer = setTimeout(function(){
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
      light.addLog(sprintf('Button pushed for light %d', lightId));
      if (result.state.on) {
        light.turnOff();
      } else {
        light.turnOnWithTimer();
      }
    });
  });
}