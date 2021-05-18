const logger = require('./logger')
const timeCheck = require('./time-check')
const moment = require('moment')

const lights = require('./lights')
const hex2rgb = require('./hex2rgb')
const colorConverter = require('cie-rgb-color-converter')

let lightIds = []
let currentLights = []

exports.remove = function (lightId) {
  clearTimeout(currentLights[lightId].timer)
}

exports.update = async function (lightId) {
  const curDate = moment()
  if (currentLights[lightId].timer) {
    clearTimeout(currentLights[lightId].timer)
  }

  const light = currentLights[lightId]
  let lightSettings = false
  let closestTime = curDate.clone().add(1, 'd')

  // Determine what schedule currently applies based on newest set
  // or most time remaining
  const schedules = Object.values(light.colorSchedule)
  let schedule
  for (let i = 0; i < schedules.length; i++) {
    schedule = schedules[i]

    if (!schedule.start) continue

    schedule.actualStart = moment(schedule.start, 'h:ma')
    schedule.actualEnd = moment(schedule.end, 'h:ma')
    if (schedule.actualEnd < curDate) {
      schedule.actualEnd.add(1, 'd')
    }
    schedule.nextStart = moment(schedule.start, 'h:ma')
    if (schedule.nextStart < curDate) {
      schedule.nextStart.add(1, 'd')
    }

    // Watch the next time a change happens
    if (schedule.nextStart < closestTime) closestTime = schedule.nextStart
    if (schedule.actualEnd < closestTime) closestTime = schedule.actualEnd

    if (timeCheck(curDate, schedule.start, schedule.end)) {
      if (lightSettings === false) {
        lightSettings = schedule
      } else {
        if (lightSettings.start !== schedule.start) {
          if (schedule.actualStart > lightSettings.actualStart) {
            lightSettings = schedule
          }
        } else if (lightSettings.actualEnd < schedule.actualEnd) {
          lightSettings = schedule
        }
      }
    } else if (schedule.state === 'off' && curDate.format('h:mm a') === schedule.start) {
      lightSettings = schedule
    }
  }

  light.timer = setTimeout(function () {
    exports.update(lightId)
  }, closestTime - curDate)

  if (lightSettings === false) return

  if (!lightSettings.color) {
    lightSettings.color = (typeof light.settings.color !== 'undefined') ? light.settings.color : 'FFFFFF'
  }
  if (!lightSettings.brightness) {
    lightSettings.brightness = (typeof light.settings.brightness !== 'undefined') ? light.settings.brightness : 50
  }

  const deviceState = await lights.getState(light)
  if (!deviceState) {
    if (typeof light.retries !== 'undefined' && light.retries > 10) {
      logger.error(`Failed 10 times to get state for ${JSON.stringify(light)}. Giving up`, deviceState)
      return
    } if (typeof light.retries === 'undefined') {
      light.retries = 1
    } else {
      light.retries++
    }
    logger.error(`Failed ${light.retires} times to get state for ${JSON.stringify(light)}. Pausing then trying again`, deviceState)

    clearTimeout(light.timer)
    light.timer = setTimeout(function () {
      exports.update(lightId)
    }, light.retries * 60 * 1000)
    return
  }

  light.retries = 0

  if (deviceState.on && lightSettings.state === 'asis') {
    // If the light is already on, we still need to double-check that we're
    // showing the right color or brightness
    let changeColor = false
    if (light.type === 'hue') {
      if (light.device.mappedColorGamut) {
        const newColor = hex2rgb(lightSettings.color)
        const currentColorXY = deviceState.xy
        const newColorXY = colorConverter.rgbToXy(newColor[0], newColor[1], newColor[2], light.modelId)
        if (Math.floor(newColorXY[0] * 10) !== Math.floor(currentColorXY[0] * 10) || Math.floor(newColorXY[1] * 10) !== Math.floor(currentColorXY[1] * 10)) {
          changeColor = true
        }
      }
      if (deviceState.bri !== lightSettings.brightness) {
        changeColor = true
      }
    } else if (light.type === 'fastled') {
      if (lightSettings.pattern !== deviceState.pattern) {
        changeColor = true
      }
      if (Math.round(lightSettings.brightness * 2.55) !== deviceState.brightness) {
        changeColor = true
      }
      if (hex2rgb(lightSettings.color).join(',') !== deviceState.solidColor) {
        changeColor = true
      }
      if (lightSettings.palette !== deviceState.palette) {
        changeColor = true
      }
    }
    if (changeColor === true) {
      lights.turnOn(light.id, lightSettings)
    }
  } else if (deviceState.on && lightSettings.state === 'off') {
    lights.turnOff(light.id)
  } else if (lightSettings.state === 'on') {
    lightSettings.timer = schedule.actualEnd - curDate
    lights.turnOn(light.id, lightSettings)
  }
}

exports.init = async function () {
  let i
  for (i = 0; i < lightIds.length; i++) {
    if (currentLights[lightIds[i]] && currentLights[lightIds[i]].timer) {
      clearTimeout(currentLights[lightIds[i]].timer)
    }
  }

  currentLights = (await lights.getAll()).lights
  lightIds = Object.keys(currentLights)

  for (i = 0; i < lightIds.length; i++) {
    exports.update(lightIds[i])
  }
}
