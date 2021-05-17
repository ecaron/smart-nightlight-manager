const timeCheck = require('../time-check')
const logger = require('../logger')
const db = require('../db')

const hue = require('./hue/')
exports.hue = hue

const timers = {}
const logs = {}

const DEFAULT_STAYON_MINUTES = 60

const fastled = require('./fastled/')
exports.fastled = fastled

exports.getAll = async function () {
  const lights = {}
  let messages = []

  const hueLights = await hue.getAll()
  messages = messages.concat(hueLights.messages)
  Object.keys(hueLights.lights).forEach(function (lightId) {
    const hueLight = hueLights.lights[lightId]
    lights[hueLight.id] = hueLight
  })

  const fastLEDLigts = await fastled.getAll()
  messages = messages.concat(fastLEDLigts.messages)
  Object.keys(fastLEDLigts.lights).forEach(function (lightId) {
    const fastLEDLight = fastLEDLigts.lights[lightId]
    lights[fastLEDLight.id] = fastLEDLight
  })

  Object.keys(timers).forEach(function (lightId) {
    if (timers[lightId].timer && !timers[lightId].timer._called) {
      lights[lightId].timerTime = timers[lightId].time.toString()
    }
  })
  Object.keys(logs).forEach(function (lightId) {
    lights[lightId].logs = logs[lightId]
  })

  return {
    lights: lights,
    messages: messages
  }
}

exports.add = async function (type, lightDetails) {
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

exports.turnOn = async function (lightId, lightDetails) {
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
  if (typeof lightDetails.color === 'undefined') {
    lightDetails.color = light.settings.color || 'FFFFFF'
  }
  if (typeof lightDetails.brightness === 'undefined') {
    lightDetails.brightness = light.settings.brightness || 50
  }
  if (light.type === 'fastled') {
    if (typeof lightDetails.pattern === 'undefined') {
      lightDetails.pattern = light.settings.pattern || 'Solid Color'
    }
    if (typeof lightDetails.palette === 'undefined') {
      lightDetails.palette = light.settings.palette || 'Heat'
    }
  }

  if (light.type === 'hue') {
    hue.turnOn(light, lightDetails)
  } else if (light.type === 'fastled') {
    fastled.turnOn(light, lightDetails)
  }

  if (lightDetails.timer) {
    let stayOnTime = DEFAULT_STAYON_MINUTES * 60 * 1000
    if (typeof lightDetails.timer === 'number') {
      stayOnTime = lightDetails.timer
    } else if (typeof light.settings.stayOnMinutes === 'number') {
      stayOnTime = light.settings.stayOnMinutes * 60 * 1000
    }

    if (typeof timers[lightId] !== 'undefined' && timers[lightId].timer) {
      clearTimeout(timers[lightId].timer)
    }
    timers[lightId] = {
      time: new Date((new Date()).getTime() + stayOnTime),
      timer: setTimeout(function () {
        exports.turnOff(lightId)
        exports.addLog(lightId, `${Math.round(stayOnTime / 60000)} minutes reached, turning off light ${lightId}.`)
      }, stayOnTime * 60 * 1000)
    }
  }
}

exports.turnOff = async function (lightId) {
  const light = db.lights.get(lightId)
  if (light.type === 'hue') {
    hue.turnOff(light)
  } else if (light.type === 'fastled') {
    fastled.turnOff(light)
  }
}

exports.getState = async function (light) {
  if (light.type === 'hue') {
    return hue.getState(light)
  } else if (light.type === 'fastled') {
    return fastled.getState(light)
  }
}

exports.addLog = function (lightId, message) {
  if (typeof logs[lightId] === 'undefined') logs[lightId] = []
  logs[lightId].unshift('[' + (new Date()).toString() + '] ' + message)
  while (logs[lightId].length > 20) {
    logs[lightId].pop()
  }
  logger.info(message)
}
