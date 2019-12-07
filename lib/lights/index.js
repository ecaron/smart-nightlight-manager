const timeCheck = require('../time-check')
const logger = require('../logger')

const hue = require('./hue/')
exports.hue = hue

const fastled = require('./fastled/')
exports.fastled = fastled

exports.getAll = async function (db, includeUnknown) {
  let lights = await hue.getAll(db, includeUnknown)
  lights = lights.concat(await fastled.getAll(db, includeUnknown))
  // light.logs = bridge.lights[light.id].log
  // if (bridge.lights[light.id].timer) {
  //   light.timerTime = bridge.lights[light.id].timerTime.toString()
  // }
  return lights
}

exports.add = async function (db, type, lightDetails) {
  const light = {
    type: type,
    settings: {},
    colorSchedule: {}
  }
  Object.keys(lightDetails).forEach(function (key) {
    light[key] = lightDetails[key]
  })
  db.lights.insert(light)
}

exports.turnOn = async function (db, lightId, lightDetails) {
  const light = db.lights.get(lightId)
  if (typeof lightDetails === 'undefined') {
    lightDetails = {}
  }
  if (typeof light.colorSchedule !== 'undefined') {
    const curDate = new Date()
    Object.keys(light.colorSchedule).forEach(function (scheduleKey) {
      const schedule = light.colorSchedule[scheduleKey]
      if (timeCheck(curDate, schedule.start, schedule.end)) {
        if (typeof lightDetails.color === 'undefined') lightDetails.color = schedule.color
        if (typeof lightDetails.brightness === 'undefined') lightDetails.brightness = schedule.brightness
      }
    })
  }
  if (typeof lightDetails.color === 'undefined') lightDetails.color = 'FFFFFF'
  if (typeof lightDetails.brightness === 'undefined') lightDetails.brightness = 50

  if (light.type === 'hue') {
    hue.turnOn(db, light, lightDetails)
  } else if (light.type === 'fastled') {
    fastled.turnOn(db, light, lightDetails)
  }
}

exports.turnOff = async function (db, lightId) {
  const light = db.lights.get(lightId)
  if (light.type === 'hue') {
    hue.turnOff(db, light)
  } else if (light.type === 'fastled') {
    fastled.turnOff(db, light)
  }
}

exports.log = function (type, message) {
  logger[type](message)
}
