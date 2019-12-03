const hue = require('node-hue-api').v3

exports.setup = require('./setup')

exports.getAll = async function (db) {
  const bridgeInfo = db.settings.findOne({ type: 'hue' })
  if (!bridgeInfo) {
    throw new Error('Hue bridge not found in the local database')
  }
  const api = await hue.api.createLocal(bridgeInfo.ip).connect(bridgeInfo.username)
  const allLights = await api.lights.getAll()
  allLights.forEach(light => {
    light.deviceId = light.id
    const knownLight = db.lights.findOne({ type: 'hue', deviceId: String(light.deviceId) })
    if (knownLight !== null) {
      light.id = knownLight.id
      light.knownLight = true
      light.settings = knownLight.settings || {}
      light.colorSchedule = knownLight.colorSchedule || {}
    } else {
      light.knownLight = false
      light.id = false
    }
  })
  return allLights
}

// var hue = require('node-hue-api')

// var hex2rgb = require('./hex2rgb')
// var logger = require('./logger')
// var timeCheck = require('./time-check')
// var db = require('./db')

// var bridgeInfo = db.get('bridge').first().value()
// var defaultStayOnMinutes = 60

// if (!bridgeInfo) {
//   console.warn('Missing config/db.json does not contain bridge information. Did you forget to run "npm run setup"?')
//   process.exit(1)
// }

// if (typeof bridgeInfo !== 'object' || !bridgeInfo.ip || !bridgeInfo.username) {
//   console.warn('config.bridge.json does not contain an object with "ip" and "username". Did you forget to run "npm run setup"?')
//   process.exit(1)
// }

// exports.HueApi = hue.HueApi
// exports.lightState = hue.lightState
// exports.api = new exports.HueApi(bridgeInfo.ip, bridgeInfo.username)
// exports.lightLog = {}
// exports.lights = {}
// exports.api.lights(function (err, data) {
//   if (err) {
//     logger.error(err)
//   }
//   data.lights.forEach(function (light) {
//     exports.lights[light.id] = {
//       id: light.id,
//       timer: false,
//       timerTime: false,
//       addLog: function (message) {
//         if (this.log.length > 20) {
//           this.log.shift()
//         }
//         this.log.push('[' + (new Date()).toString() + '] ' + message)
//         logger.info(message)
//       },
//       log: [],
//       turnOn: function () {
//         var self = this
//         this.addLog(`Turning on light ${this.id}.`)
//         var light = db.get('lights').find({ id: self.id }).value()
//         var lightSettings = {}
//         var lightColor = '000000'
//         var lightBrightness = '10'
//         if (typeof light !== 'undefined') {
//           if (typeof light.settings !== 'undefined') {
//             lightSettings = light.settings
//             if (lightSettings.color) {
//               lightColor = lightSettings.color
//             }
//             if (lightSettings.brightness) {
//               lightBrightness = lightSettings.brightness
//             }
//           }
//           if (typeof light.colorSchedule !== 'undefined') {
//             var curDate = new Date()
//             light.colorSchedule.forEach(function (schedule) {
//               if (timeCheck(curDate, schedule.start, schedule.end)) {
//                 lightColor = schedule.color
//                 lightBrightness = schedule.brightness
//               }
//             })
//           }
//         }

//         var state = exports.lightState.create().on()
//         if (typeof lightBrightness === 'undefined') {
//           state.brightness(10)
//         } else {
//           state.brightness(lightBrightness)
//         }
//         state.rgb(hex2rgb(lightColor))
//         exports.api.setLightState(self.id, state, function (err, lights) {
//           // jshint unused:false
//           if (err) throw err
//         })
//       },
//       turnOff: function (skipConsole) {
//         var self = this

//         if (self.timer) {
//           clearTimeout(self.timer)
//           self.timer = false
//         }
//         exports.api.setLightState(this.id, { on: false }, function (err, result) {
//           // jshint unused:false
//           if (err) throw err
//           if (!skipConsole) {
//             self.addLog(`Turning off light ${self.id}`)
//           }
//         })
//       },
//       turnOnWithTimer: function () {
//         var self = this
//         var light = db.get('lights').find({ id: self.id }).value()
//         var lightSettings = {}
//         if (typeof light !== 'undefined' && typeof light.settings !== 'undefined') {
//           lightSettings = light.settings
//         }
//         var stayOnMinutes = defaultStayOnMinutes
//         if (typeof lightSettings === 'object' && lightSettings.stayOnMinutes > 0) {
//           stayOnMinutes = lightSettings.stayOnMinutes
//         }
//         self.timerTime = new Date((new Date()).getTime() + stayOnMinutes * 60 * 1000)
//         this.turnOn()
//         this.timer = setTimeout(function () {
//           self.turnOff(true)
//           self.addLog(`${stayOnMinutes} minutes reached, turning off light ${self.id}.`)
//         }, stayOnMinutes * 60 * 1000)
//       }
//     }
//   })
// })
