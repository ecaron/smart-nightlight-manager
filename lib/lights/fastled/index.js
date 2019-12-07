const db = require('../../db')

exports.getAll = function (includeUnknown) {
  return db.lights.find({ type: 'fastled' })
}
