const axios = require('axios')
const db = require('../../db')
const hex2rgb = require('../../hex2rgb')

exports.PALETTES = [
  'Rainbow',
  'Rainbow Stripe',
  'Cloud',
  'Lava',
  'Ocean',
  'Forest',
  'Party',
  'Heat'
]

exports.PATTERNS = [
  'Pride',
  'Color Waves',
  'Rainbow Twinkles',
  'Snow Twinkles',
  'Cloud Twinkles',
  'Incandescent Twinkles',
  'Retro C9 Twinkles',
  'Red & White Twinkles',
  'Blue & White Twinkles',
  'Red, Green & White Twinkles',
  'Fairy Light Twinkles',
  'Snow 2 Twinkles',
  'Holly Twinkles',
  'Ice Twinkles',
  'Party Twinkles',
  'Forest Twinkles',
  'Lava Twinkles',
  'Fire Twinkles',
  'Cloud 2 Twinkles',
  'Ocean Twinkles',
  'Rainbow',
  'Rainbow With Glitter',
  'Solid Rainbow',
  'Confetti',
  'Sinelon',
  'Beat',
  'Juggle',
  'Fire',
  'Water',
  'Solid Color'
]

exports.getAll = async function (includeUnknown) {
  const allFastLEDs = db.lights.find({ type: 'fastled' })
  const lights = []
  let light, knownLight
  for (let i = 0; i < allFastLEDs.length; i++) {
    knownLight = allFastLEDs[i]
    light = {
      name: knownLight.settings.name,
      ip: knownLight.settings.ip,
      type: knownLight.type,
      id: knownLight.$loki,
      knownLight: true,
      settings: knownLight.settings || {},
      colorSchedule: knownLight.colorSchedule || {}
    }
    lights.push(light)
  }
  return lights
}

exports.getState = async function (light) {
  const rawState = await axios.get(`http://${light.settings.ip}/all`)
  const state = {}
  let part
  for (let i = 0; i < rawState.data.length; i++) {
    part = rawState.data[i]
    if (part.name === 'power') {
      state.on = part.value
    } else if (part.name === 'pattern') {
      state.pattern = exports.PATTERNS[part.value]
    } else if (part.name === 'palette') {
      state.palette = exports.PALETTES[part.value]
    } else {
      state[part.name] = part.value
    }
  }
  return state
}

exports.turnOn = async function (light, lightSettings) {
  if (lightSettings.brightness) {
    await axios.post(`http://${light.settings.ip}/brightness?value=${lightSettings.brightness * 2.55}`)
  }
  if (lightSettings.pattern) {
    const patternKey = exports.PATTERNS.indexOf(lightSettings.pattern)
    if (patternKey >= 0) {
      await axios.post(`http://${light.settings.ip}/pattern?value=${patternKey}`)
    }
  }
  if (lightSettings.palette) {
    const paletteKey = exports.PALETTES.indexOf(lightSettings.palette)
    if (paletteKey >= 0) {
      await axios.post(`http://${light.settings.ip}/palette?value=${paletteKey}`)
    }
  }
  if (lightSettings.solidColor && lightSettings.palette === 'Solid Color') {
    const hex = hex2rgb(lightSettings.solidColor)
    await axios.post(`http://${light.settings.ip}/solidColor?r=${hex[0]}&g=${hex[1]}&b=${hex[2]}`)
  }
  await axios.post(`http://${light.settings.ip}/power?value=1`)
}

exports.turnOff = async function (light) {
  await axios.post(`http://${light.settings.ip}/power?value=0`)
}
