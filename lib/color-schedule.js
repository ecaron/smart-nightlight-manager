var ColorSchedule = {
  create: function (req, res) {
    const light = req.db.lights.get(req.body.light)
    if (!light) {
      req.flash('error', 'Unable to load database for that light.')
      return res.redirect('/')
    }

    const scheduleKey = req.body.start_time + '==' + req.body.end_time
    const scheduleValue = {
      start: req.body.start_time,
      end: req.body.end_time,
      state: req.body.state
    }
    Object.keys(req.body.settings).forEach(function (settingKey) {
      scheduleValue[settingKey] = req.body.settings[settingKey]
    })
    light.colorSchedule[scheduleKey] = scheduleValue
    req.db.lights.update(light)
    req.flash('success', 'Color schedule has been successfully added for the light!')
    res.redirect('/')
  },
  update: function (req, res) {
    const light = req.db.lights.get(req.body.light)
    if (!light) {
      req.flash('error', 'Unable to load database for that light.')
      return res.redirect('/')
    }

    const oldKey = req.body.id
    const newKey = req.body.start_time + '==' + req.body.end_time

    const scheduleValue = {
      start: req.body.start_time,
      end: req.body.end_time,
      state: req.body.state
    }
    Object.keys(req.body.settings).forEach(function (settingKey) {
      scheduleValue[settingKey] = req.body.settings[settingKey]
    })

    if (oldKey !== newKey) {
      delete light.colorSchedule[oldKey]
    }
    light.colorSchedule[newKey] = scheduleValue
    req.db.lights.update(light)
    req.flash('success', 'Updated schedule for that light.')
    res.redirect('/')
  },
  delete: function (req, res) {
    const light = req.db.lights.get(req.body.light)
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
    req.db.lights.update(light)
    req.flash('success', 'Deleted color schedule for that light.')
    res.redirect('/')
  }
}

module.exports = ColorSchedule
