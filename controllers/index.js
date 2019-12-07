const express = require('express')
const async = require('async')
const router = express.Router()
const lights = require('../lib/lights')
const colorSchedule = require('../lib/color-schedule')
router.use('/settings', require('./settings'))

router.get('/', async function (req, res, next) {
  let allLights
  try {
    allLights = await lights.getAll()
  } catch (err) {
    return next(err)
  }

  var templateData = {}
  let light
  templateData.colors = require('../lib/colors')
  templateData.lights = {}

  for (let i = 0; i < allLights.length; i++) {
    light = allLights[i]
    if (light.type === 'hue') {
      const result = await lights.hue.getState(light)
      if (result === false) {
        console.log(`Failed to get state for ${JSON.stringify(light)}`)
        continue
      }
      light.state = (result.on) ? 'On' : 'Off'
      light.result = result
    }
    templateData.lights[light.id] = light
  }
  res.render('index', templateData)
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
      const stayOnMinutes = parseInt(req.body.minutes)
      if (isNaN(stayOnMinutes)) {
        req.flash('warn', `Invalid number input supplied - ${req.body.minutes}`)
        res.redirect('/')
      }
      light = req.db.lights.get(req.body.light)
      req.flash('success', 'Timer has been successfully set for the light!')
      light.settings.stayOnMinutes = stayOnMinutes
      req.db.lights.update(light)
      res.redirect('/')
      return

    case 'default-color':
      req.flash('success', 'Default color has been successfully set for the light!')
      light = req.db.lights.get(req.body.light)
      light.settings.color = req.body.color
      req.db.lights.update(light)
      res.redirect('/')
      return

    case 'default-brightness':
      req.flash('success', 'Default brightness has been successfully set for the light!')
      light = req.db.lights.get(req.body.light)
      light.settings.brightness = req.body.brightness
      req.db.lights.update(light)
      res.redirect('/')
      return

    case 'turn-on-keep-on':
      req.flash('success', 'Light has been turned on and will stay on!')
      lights.addLog(lightId, `Website turn-on-keep-on for light ${lightId}.`)
      await lights.turnOn(req.body.light)
      break

    case 'turn-on-with-timer':
      req.flash('success', 'Light has been turned on and timer has been started!')
      lights.addLog(lightId, `Website turn-on-with-timer for light ${lightId}.`)
      await lights.turnOn(req.body.light, {
        timer: true
      })
      break

    case 'turn-off':
      req.flash('success', 'Light has been turned off!')
      lights.addLog(lightId, `Website turn-off for light ${lightId}.`)
      await lights.turnOff(req.body.light)
      break

    case 'toggle-keep-on':
    case 'toggle-with-timer':
      light = await lights.get(req.body.light)
      if (light.status.on) {
        await lights.turnOff(req.body.light)
        lights.addLog(lightId, `Button turn-off for light ${lightId}.`)
        res.send('Turned off')
      } else if (req.body.cmd === 'toggle-keep-on') {
        await lights.turnOn(req.body.light)
        lights.addLog(lightId, `Button turn-on-keep-on for light ${lightId}.`)
        res.send('Turned on, keeping on')
      } else {
        await lights.turnOn(req.body.light, {
          timer: true
        })
        lights.addLog(lightId, `Button turn-on-with-timer for light ${lightId}.`)
        res.send('Turned on, timer started')
      }
      return

    case 'experiment':
      if (req.body.light) {
        try {
          if (req.body.intend_state === 'on') {
            await lights.turnOn(req.body.light, {
              color: req.body.color,
              brightness: req.body.brightness
            })
          } else {
            await lights.turnOff(req.body.light)
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
