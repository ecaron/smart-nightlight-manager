const shortid = require('shortid')
const express = require('express')
const router = express.Router()
const hueSetup = require('../lib/lights/hue/setup')

router.get('/', function (req, res) {
  const templateData = {}
  templateData.hueNotConfigured = !req.db.settings.findOne({ type: 'hue' })
  res.render('settings', templateData)
})

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'))
  }
  if (req.body.cmd === 'add-button') {
    const newEntry = {
      id: shortid.generate(),
      settings: {}
    }
    if (req.body.type === 'fastled') {
      newEntry.type = 'fastled'
      try {
        const newConfig = JSON.parse(req.body.config)
        if (!newConfig.name || !newConfig.ip) {
          return next(new Error('POST without a cmd'))
        }
        newEntry.settings = newConfig
        req.flash('success', `Light "${newConfig.name}" has been created`)
      } catch (e) {
        return next(e)
      }
    } else {
      return next(new Error('Unrecognized light type'))
    }
    req.db.lights.insert(newEntry)
  } else if (req.body.cmd === 'configure-hue') {
    return hueSetup(req).then(() => {
      res.redirect('/settings?2')
    }).catch(e => {
      req.flash('error', e.toString())
      res.redirect('/settings?1')
    })
  }
  res.redirect('/')
})

module.exports = router
