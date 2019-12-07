const hue = require('node-hue-api').v3
const hex2rgb = require('../../hex2rgb')
const db = require('../../db')

exports.setup = require('./setup')

let connectedApi = false
const getApi = async function () {
  if (connectedApi === false) {
    const bridgeInfo = db.settings.findOne({ type: 'hue' })
    if (!bridgeInfo) {
      throw new Error('Hue bridge not found in the local database')
    }
    connectedApi = await hue.api.createLocal(bridgeInfo.ip).connect(bridgeInfo.username)
  }
  return connectedApi
}

exports.getAll = async function (includeUnknown) {
  const api = await getApi()
  const allHueLights = await api.lights.getAll()
  const lights = []
  allHueLights.forEach(hueLight => {
    const light = {}
    light.device = hueLight
    const knownLight = db.lights.findOne({ type: 'hue', deviceId: String(hueLight.id) })
    if (knownLight !== null) {
      light.type = knownLight.type
      light.name = hueLight.name
      light.deviceId = knownLight.deviceId
      light.id = knownLight.$loki
      light.knownLight = true
      light.settings = knownLight.settings || {}
      light.colorSchedule = knownLight.colorSchedule || {}
    } else {
      light.knownLight = false
    }
    if (knownLight !== null || includeUnknown === true) {
      lights.push(light)
    }
  })

  return lights
}

exports.turnOn = async function (light, lightSettings) {
  const api = await getApi()
  const LightState = hue.lightStates.LightState
  const state = new LightState().on()

  if (lightSettings.brightness) state.brightness(lightSettings.brightness)
  if (lightSettings.color) state.rgb(hex2rgb(lightSettings.color))

  await api.lights.setLightState(light.deviceId, state)
}

exports.turnOff = async function (light) {
  const api = await getApi()
  const LightState = hue.lightStates.LightState

  const state = new LightState().off()
  await api.lights.setLightState(light.deviceId, state)
}

exports.getState = async function (light) {
  const api = await getApi()
  try {
    return await api.lights.getLightState(light.deviceId)
  } catch (e) {
    console.warn(e)
    return false
  }
}
