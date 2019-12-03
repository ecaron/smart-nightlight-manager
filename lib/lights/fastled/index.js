exports.getAll = function (db) {
  return db.lights.find({ type: 'fastled' })
}
