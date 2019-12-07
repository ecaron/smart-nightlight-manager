exports.getAll = function (db, includeUnknown) {
  return db.lights.find({ type: 'fastled' })
}
