var ColorSchedule = {
  create: function (db, req, res) {
    const light = db.lights.findOne({ id: req.body.light })
    if (!light) {
      req.flash('error', 'Unable to load database for that light.')
      return res.redirect('/')
    }

    const scheduleKey = req.body.start_time + '==' + req.body.end_time
    const scheduleValue = {
      start: req.body.start_time,
      end: req.body.end_time,
      color: req.body.color,
      state: req.body.state,
      brightness: req.body.brightness
    }
    light.colorSchedule[scheduleKey] = scheduleValue
    req.flash('success', 'Color schedule has been successfully added for the light!')
    res.redirect('/')
  },
  update: function (db, req, res) {
    const light = db.lights.findOne({ id: req.body.light })
    if (!light) {
      req.flash('error', 'Unable to load database for that light.')
      return res.redirect('/')
    }

    const oldKey = req.body.id
    const newKey = req.body.start_time + '==' + req.body.end_time

    const scheduleValue = {
      start: req.body.start_time,
      end: req.body.end_time,
      color: req.body.color,
      state: req.body.state,
      brightness: req.body.brightness
    }

    if (oldKey !== newKey) {
      delete light.colorSchedule[oldKey]
    }
    light.colorSchedule[newKey] = scheduleValue
    req.flash('success', 'Updated schedule for that light.')
    res.redirect('/')
  },
  delete: function (db, req, res) {
    const light = db.lights.findOne({ id: req.body.light })
    if (!light) {
      req.flash('error', 'Unable to load database for that light.')
      return res.redirect('/')
    }

    const scheduleKey = req.body.id
    if (!light.colorSchedule[scheduleKey]) {
      req.flash('error', 'Unable to load database for that light.')
      return res.redirect('/')
    }
    delete light.colorSchedule[scheduleKey]
    req.flash('success', 'Deleted color schedule for that light.')
    res.redirect('/')
  }
}

module.exports = ColorSchedule
