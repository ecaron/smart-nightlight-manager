const shortid = require('shortid')
const hue = require('./hue/')
exports.hue = hue

const fastled = require('./fastled/')
exports.fastled = fastled

exports.getAll = async function (db) {
  const lights = await hue.getAll(db)
  return lights.concat(await fastled.getAll(db))
}

exports.add = async function (db, type, lightDetails) {
  const light = {
    type: type,
    id: shortid.generate(),
    settings: {},
    colorSchedule: {}
  }
  Object.keys(lightDetails).forEach(function (key) {
    light[key] = lightDetails[key]
  })
  db.lights.insert(light)
}
