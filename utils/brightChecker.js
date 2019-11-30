'use strict'

var hue = require('node-hue-api')

var hex2rgb = require('../lib/hex2rgb')
var db = require('../lib/db')

if (!process.env.LIGHT) {
  console.warn('LIGHT must be set as an environment variable so we know what to target')
  process.exit(1)
}

var bridgeInfo = db.get('bridge').first().value()

if (!bridgeInfo) {
  console.warn('Missing config/db.json does not contain bridge information. Did you forget to run "npm run setup"?')
  process.exit(1)
}

if (typeof bridgeInfo !== 'object' || !bridgeInfo.ip || !bridgeInfo.username) {
  console.warn('config.bridge.json does not contain an object with "ip" and "username". Did you forget to run "npm run setup"?')
  process.exit(1)
}

var HueApi = hue.HueApi
var lightState = hue.lightState
var api = new HueApi(bridgeInfo.ip, bridgeInfo.username)

var brightness = 0
console.log('About to cycle through brightness, from 0% to 100%')
setInterval(function () {
  var state = lightState.create().on()
  state.brightness(brightness)
  console.log('Brightness at ' + brightness)
  if (brightness === 100) process.exit()
  brightness += 10
  state.rgb(hex2rgb('FFFFFF'))
  api.setLightState(process.env.LIGHT, state, function (err, lights) {
    if (err) console.log(err)
  })
}, 5000)
