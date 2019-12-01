module.exports = function () {}
// const timeCheck = require('./time-check')
// const rgb = require('../node_modules/node-hue-api/lib/rgb')
// const colorGamut = require('../node_modules/node-hue-api/lib/bridge-model/devices/lights/color-gamuts')

// const lights = require('./lights')
// const db = require('./db')
// const hex2rgb = require('./hex2rgb')

// module.exports = function () {
//   bridge.api.lights(function (err, data) {
//     if (err) {
//       console.warn(err)
//       return
//     }

//     var curDate = new Date()
//     data.lights.forEach(function (light) {
//       bridge.api.lightStatus(light.id, function (err, result) {
//         if (err) {
//           throw err
//         }

//         var lightConfig = db.get('lights').find({ id: light.id }).value()
//         var newColor = false
//         var intendedState = 'asis'
//         var lightBrightness = '10'
//         if (typeof lightConfig !== 'undefined' && typeof lightConfig.colorSchedule !== 'undefined') {
//           lightConfig.colorSchedule.forEach(function (schedule) {
//             if (timeCheck(curDate, schedule.start, schedule.end)) {
//               newColor = rgb.rgbToXY(hex2rgb(schedule.color), colorGamut.a)
//               lightBrightness = schedule.brightness
//               if (typeof schedule.state !== 'undefined') intendedState = schedule.state
//             }
//           })
//         }
//         if (result.state.on && intendedState === 'asis') {
//           var currentColor = result.state.xy

//           if (newColor === false) {
//             return
//           }
//           if (Math.floor(newColor[0] * 10) === Math.floor(currentColor[0] * 10) && Math.floor(newColor[1] * 10) === Math.floor(currentColor[1] * 10)) {
//             return
//           }
//           var state = bridge.lightState.create().xy(newColor[0], newColor[1])
//           if (typeof lightBrightness === 'undefined') {
//             state.brightness(10)
//           } else {
//             state.brightness(lightBrightness)
//           }

//           bridge.api.setLightState(light.id, state, function (err, lights) {
//             // jshint unused:false
//             if (err) {
//               throw err
//             }
//           })
//         } else if (result.state.on && intendedState === 'off') {
//           bridge.lights[light.id].turnOff()
//         } else if (!result.state.on & intendedState === 'on') {
//           bridge.lights[light.id].turnOn()
//         }
//       })
//     })
//   })
// }
