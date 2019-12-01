const hue = require('./hue/')
exports.hue = hue

const fastled = require('./fastled/')
exports.fastled = fastled

exports.getAll = async function () {
  const lights = await hue.getAll()
  lights.concat(await fastled.getAll())
}
