/* eslint new-cap: ["error", { "newIsCap": false }] */
const hue = require('node-hue-api').v3

const hex2rgb = require('../lib/hex2rgb')
const db = require('../lib/db')

if (process.argv.length !== 3) {
  console.warn('This script must be run as `node brightChecker.js ID`, where ID is the number Hue has for light')
  process.exit(1)
}

db.event.on('loaded', function () {
  const bridgeInfo = db.settings.findOne({ type: 'hue' })

  if (!bridgeInfo) {
    console.warn('Did you forget to run Hue settings setup?')
    process.exit(1)
  }

  const LightState = hue.lightStates.LightState
  hue.api.createLocal(bridgeInfo.ip).connect(bridgeInfo.username).then(api => {
    let brightness = 0
    console.log('About to cycle through brightness, from 0% to 100%.')
    setInterval(async function () {
      const state = new LightState().on().brightness(brightness)
      console.log('Brightness at ' + brightness)
      if (brightness === 100) process.exit()
      brightness += 10
      state.rgb(hex2rgb('FFFFFF'))
      try {
        await api.lights.setLightState(process.argv[2], state)
      } catch (e) {
        console.warn(e)
        process.exit(1)
      }
    }, 5000)
  }).catch(err => {
    console.warn(err)
  })
})
