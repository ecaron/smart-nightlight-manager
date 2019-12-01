const shortid = require('shortid')
const express = require('express')
const router = express.Router()
const hueSetup = require('../lib/lights/hue/setup')
const lights = require('../lib/lights')

router.get('/', async function (req, res) {
  const templateData = {}
  const hueBridge = req.db.settings.findOne({ type: 'hue' })
  templateData.hueNotConfigured = !hueBridge
  if (hueBridge) {
    templateData.hueLights = await lights.hue.getAll(req.db)
  }
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
    return lights.hue.setup(req).then(() => {
      res.redirect('/settings')
    }).catch(e => {
      req.flash('error', e.toString())
      res.redirect('/settings')
    })
  }
  res.redirect('/')
})

module.exports = router
