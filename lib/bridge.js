'use strict';

try {
  var bridgeInfo = require('../config/bridge.json');
} catch (e) {
  console.warn('Missing config/bridge.json - Exiting!');
  process.exit(1);
}

if (typeof bridgeInfo !== 'object' || !bridgeInfo.ip || !bridgeInfo.username) {
  console.warn('config.bridge.json does not contain an object with "ip" and "username". Exiting');
  process.exit(1);
}

var hue = require('node-hue-api');

exports.HueApi = hue.HueApi;
exports.lightState = hue.lightState;
exports.api = new exports.HueApi(bridgeInfo.ip, bridgeInfo.username);
