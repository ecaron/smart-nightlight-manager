const timeCheck = require('./time-check')
const rgb = require('../node_modules/node-hue-api/lib/rgb')
const colorGamut = require('../node_modules/node-hue-api/lib/bridge-model/devices/lights/color-gamuts')

const lights = require('./lights')
const hex2rgb = require('./hex2rgb')

module.exports = async function () {
  const curDate = new Date()

  const currentLights = await lights.getAll()
  let light
  for (let i = 0; i < currentLights.length; i++) {
    light = currentLights[i]
    let lightSettings = {
      color: (typeof light.settings.color !== 'undefined') ? light.settings.color : 'FFFFFF',
      brightness: (typeof light.settings.brightness !== 'undefined') ? light.settings.brightness : 50
    }

    Object.keys(light.colorSchedule).forEach(function (scheduleKey) {
      const schedule = light.colorSchedule[scheduleKey]
      if (timeCheck(curDate, schedule.start, schedule.end)) {
        lightSettings = schedule
      }
    })

    if (typeof lightSettings.state === 'undefined') lightSettings.state = 'asis'

    let deviceState
    if (light.type === 'hue') {
      deviceState = await lights.hue.getState(light)
    } else if (light.type === 'fastled') {
      deviceState = await lights.fastled.getState(light)
    }
    if (deviceState === false) {
      console.warn(`Failed to get state for ${JSON.stringify(light)}`)
      console.warn(deviceState)
      continue
    }

    if (deviceState.on && lightSettings.state === 'asis') {
      // If the light is already on and state is "asis", we still need to double-check
      // that we're showing the right color
      if (lightSettings.color === false) {
        continue
      }
      let changeColor = false
      if (light.type === 'hue') {
        const currentColorXY = deviceState.xy
        const newColorXY = rgb.rgbToXY(hex2rgb(lightSettings.color), colorGamut.A)
        if (Math.floor(newColorXY[0] * 10) === Math.floor(currentColorXY[0] * 10) && Math.floor(newColorXY[1] * 10) === Math.floor(currentColorXY[1] * 10)) {
        } else {
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
