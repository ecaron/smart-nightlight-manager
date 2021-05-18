const moment = require('moment')
const timeCheck = require('../time-check')
const logger = require('../logger')
const db = require('../db')

const hue = require('./hue/')
exports.hue = hue

const timers = {}
const logs = {}

const DEFAULT_STAYON_MINUTES = 60

const fastled = require('./fastled/')
let lastChange = new Date()

exports.updateLastChange = function () {
  lastChange = new Date()
}
exports.getLastChange = function () {
  return lastChange
}

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
    if (timers[lightId].timer && !timers[lightId].timer._called && timers[lightId].time) {
      lights[lightId].timerTime = timers[lightId].time.format()
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
  exports.updateLastChange()
}

exports.turnOn = async function (lightId, lightDetails, selectedSchedule) {
  const light = db.lights.get(lightId)

  if (typeof lightDetails === 'undefined') {
    lightDetails = {}
  }
  if (typeof selectedSchedule === 'undefined') {
    selectedSchedule = false
  }

  if (selectedSchedule === false && typeof light.colorSchedule !== 'undefined') {
    Object.assign(lightDetails, timeCheck.schedulePicker(light).lightSettings)
  }
  if (!lightDetails.color) {
    lightDetails.color = (typeof light.settings.color !== 'undefined') ? light.settings.color : 'FFFFFF'
  }
  if (!lightDetails.brightness) {
    lightDetails.brightness = (typeof light.settings.brightness !== 'undefined') ? light.settings.brightness : 50
  }
  if (!lightDetails.pattern) {
    lightDetails.pattern = (typeof light.settings.pattern !== 'undefined') ? light.settings.pattern : 'Solid Color'
  }
  if (!lightDetails.palette) {
    lightDetails.palette = (typeof light.settings.palette !== 'undefined') ? light.settings.palette : 'Heat'
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
      time: moment().add(stayOnTime, 'ms'),
      timer: setTimeout(function () {
        exports.turnOff(lightId)
        exports.addLog(lightId, `${Math.round(stayOnTime / 60000)} minutes reached, turning off light ${lightId}.`)
      }, stayOnTime)
    }
  }
  exports.updateLastChange()
}

exports.turnOff = async function (lightId) {
  const light = db.lights.get(lightId)
  if (light.type === 'hue') {
    hue.turnOff(light)
  } else if (light.type === 'fastled') {
    fastled.turnOff(light)
  }
  if (typeof timers[lightId] !== 'undefined') timers[lightId].time = false
  exports.updateLastChange()
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
