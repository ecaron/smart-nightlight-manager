const logger = require('./logger')
const timeCheck = require('./time-check')

const lights = require('./lights')
const hex2rgb = require('./hex2rgb')

// const checkFrequency = process.env.CHECK_FREQUENCY || 60
// setTimeout(function () {
//   setInterval(lightWatcher, checkFrequency * 1000)
// }, (checkFrequency - (new Date()).getSeconds()) * 1000)

exports.update = function () {
}

exports.init = async function () {
  const curDate = new Date()

  const currentLights = await lights.getAll()
  const lightIds = Object.keys(currentLights.lights)
  let light
  let lightSettings
  for (let i = 0; i < lightIds.length; i++) {
    light = currentLights.lights[lightIds[i]]
    lightSettings = false

    Object.keys(light.colorSchedule).forEach(function (scheduleKey) {
      const schedule = light.colorSchedule[scheduleKey]
      if (timeCheck(curDate, schedule.start, schedule.end)) {
        lightSettings = schedule
      }
    })

    if (lightSettings === false) continue

    if (!lightSettings.color) {
      lightSettings.color = (typeof light.settings.color !== 'undefined') ? light.settings.color : 'FFFFFF'
    }
    if (!lightSettings.brightness) {
      lightSettings.brightness = (typeof light.settings.brightness !== 'undefined') ? light.settings.brightness : 50
    }

    const deviceState = await lights.getState(light)
    if (!deviceState) {
      logger.error(`Failed to get state for ${JSON.stringify(light)}`, deviceState)
      continue
    }

    if (deviceState.on && lightSettings.state === 'asis') {
      // If the light is already on and state is "asis", we still need to double-check
      // that we're showing the right color
      let changeColor = false
      if (light.type === 'hue') {
        console.log(deviceState)
        /*
        const currentColorXY = deviceState.xy
        const newColorXY = rgb.rgbToXY(hex2rgb(lightSettings.color), colorGamut.A)
        if (Math.floor(newColorXY[0] * 10) === Math.floor(currentColorXY[0] * 10) && Math.floor(newColorXY[1] * 10) === Math.floor(currentColorXY[1] * 10)) {
        } else {
          changeColor = true
        }
        */
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
    } else if (!deviceState.on & lightSettings.state === 'on') {
      lights.turnOn(light.id, lightSettings)
    }
  }
}
