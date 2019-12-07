const express = require('express')
const router = express.Router()
const lights = require('../lib/lights')

router.get('/', async function (req, res) {
  const templateData = {}
  const hueBridge = req.db.settings.findOne({ type: 'hue' })
  templateData.hueNotConfigured = !hueBridge
  if (hueBridge) {
    templateData.hueLights = await lights.hue.getAll(req.db, true)
  }
  res.render('settings', templateData)
})

router.post('/', async function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'))
  }
  if (req.body.cmd === 'add-nonhue-light') {
    const newEntry = {
      settings: {}
    }
    if (req.body.type === 'fastled') {
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
    lights.add(req.db, req.body.type, newEntry)
  } else if (req.body.cmd === 'configure-hue') {
    return lights.hue.setup(req).then(() => {
      res.redirect('/settings')
    }).catch(e => {
      req.flash('error', e.toString())
      res.redirect('/settings')
    })
  } else if (req.body.cmd === 'attach-hue-lights') {
    const addingLights = req.body.lights
    for (let i = 0; i < addingLights.length; i++) {
      await lights.add(req.db, 'hue', { deviceId: addingLights[i] })
    }
    req.flash('success', 'Lights successfully associated with this system')
  }
  res.redirect('/')
})

module.exports = router
