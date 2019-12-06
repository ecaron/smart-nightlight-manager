const express = require('express')
const async = require('async')
const router = express.Router()
const lights = require('../lib/lights')
const colorSchedule = require('../lib/color-schedule')
router.use('/settings', require('./settings'))

router.get('/', async function (req, res, next) {
  let allLights
  try {
    allLights = await lights.getAll(req.db)
    console.log(`Found ${allLights.length}`)
  } catch (err) {
    return next(err)
  }

  var templateData = {}
  templateData.colors = require('../lib/colors')
  templateData.lights = {}

  async.each(allLights, function (light, callback) {
    if (light.type === 'hue') {
      const result = light.bridgeData
      light.state = (result.state.on) ? 'On' : 'Off'
      light.result = result
    }

    templateData.lights[light.id] = light
    return callback()
  }, function () {
    res.render('index', templateData)
  })
})

router.post('/', async function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'))
  }
  let light
  switch (req.body.cmd) {
    case 'create-color-schedule':
      return colorSchedule.create(req, res)

    case 'update-color-schedule':
      return colorSchedule.update(req, res)

    case 'delete-color-schedule':
      return colorSchedule.delete(req, res)

    case 'timer-length':
      light = req.db.lights.findOne({ id: req.body.light })
      req.flash('success', 'Timer has been successfully set for the light!')
      light.settings.stayOnMinutes = req.body.minutes
      res.redirect('/')
      return

    case 'default-color':
      req.flash('success', 'Default color has been successfully set for the light!')
      light = req.db.lights.findOne({ id: req.body.light })
      light.settings.color = req.body.color
      res.redirect('/')
      return

    case 'turn-on-keep-on':
      req.flash('success', 'Light has been turned on and will stay on!')
      await light.turnOn(req.db, req.body.light)
      break

    case 'turn-on-with-timer':
      req.flash('success', 'Light has been turned on and timer has been started!')
      await light.turnOn(req.db, req.body.light, {
        timer: true
      })
      break

    case 'turn-off':
      req.flash('success', 'Light has been turned off!')
      await light.turnOff(req.db, req.body.light)
      break

    case 'toggle-keep-on':
    case 'toggle-with-timer':
      light = await lights.get(req.db, req.body.light)
      if (light.status.on) {
        await light.turnOff(req.db, req.body.light)
        res.send('Turned off')
      } else if (req.body.cmd === 'toggle-keep-on') {
        await light.turnOn(req.db, req.body.light)
        res.send('Turned on, keeping on')
      } else {
        await light.turnOn(req.db, req.body.light, {
          timer: true
        })
        res.send('Turned on, timer started')
      }
      return

    case 'experiment':
      if (req.body.light) {
        try {
          if (req.body.intend_state === 'on') {
            await light.turnOn(req.db, req.body.light, {
              color: req.body.color,
              brightness: req.body.brightness
            })
          } else {
            await light.turnOff(req.db, req.body.light)
          }
        } catch (e) {
          console.log(e)
        }
      }
      res.send('Success')
      return
  }

  res.redirect('/')
})

module.exports = router
