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

exports.update = async function (lightId, options) {
  if (typeof options === 'undefined') options = {}

  // Useful for when we're making live changes to schedule
  if (options.forceOff) {
    lights.turnOff(lightId)
  }

  const curDate = moment()
  if (currentLights[lightId].timer) {
    clearTimeout(currentLights[lightId].timer)
  }

  const light = currentLights[lightId]
  const { lightSettings, closestTime } = timeCheck.schedulePicker(light)

  light.timer = setTimeout(function () {
    exports.update(lightId)
  }, closestTime - curDate)

  if (lightSettings === false) return

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
      lights.turnOn(light.id, lightSettings, true)
    }
  } else if (deviceState.on && lightSettings.state === 'off') {
    lights.turnOff(light.id)
  } else if (lightSettings.state === 'on') {
    lightSettings.timer = lightSettings.actualEnd - curDate
    lights.turnOn(light.id, lightSettings, true)
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
