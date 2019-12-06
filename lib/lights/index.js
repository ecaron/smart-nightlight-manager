const shortid = require('shortid')
const timeCheck = require('./time-check')
const logger = require('./logger')

const hue = require('./hue/')
exports.hue = hue

const fastled = require('./fastled/')
exports.fastled = fastled

exports.getAll = async function (db) {
  let lights = await hue.getAll(db)
  lights = lights.concat(await fastled.getAll(db))
  // light.logs = bridge.lights[light.id].log
  // if (bridge.lights[light.id].timer) {
  //   light.timerTime = bridge.lights[light.id].timerTime.toString()
  // }
  return lights
}

exports.add = async function (db, type, lightDetails) {
  const light = {
    type: type,
    id: shortid.generate(),
    settings: {},
    colorSchedule: {}
  }
  Object.keys(lightDetails).forEach(function (key) {
    light[key] = lightDetails[key]
  })
  db.lights.insert(light)
}

exports.turnOn = async function (db, light, lightDetails) {
  if (typeof light.colorSchedule !== 'undefined') {
    const curDate = new Date()
    light.colorSchedule.forEach(function (schedule) {
      if (timeCheck(curDate, schedule.start, schedule.end)) {
        // lightColor = schedule.color
        // lightBrightness = schedule.brightness
      }
    })
  }
}

exports.turnOff = async function (db, light) {

}

exports.log = function (type, message) {
  logger[type](message)
}
