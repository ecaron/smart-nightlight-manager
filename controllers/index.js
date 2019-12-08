const express = require('express')
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
  let result
  templateData.colors = require('../lib/colors')
  templateData.palettes = lights.fastled.PALETTES
  templateData.patterns = lights.fastled.PATTERNS
  templateData.lights = {}
  templateData.offlineLights = []

  const lightIDs = Object.keys(allLights.lights)
  for (let i = 0; i < lightIDs.length; i++) {
    light = allLights.lights[lightIDs[i]]
    result = await lights.getState(light)
    if (result === false) {
      templateData.offlineLights.push(light)
      req.flash('error', `Unable to communicate with "${light.name}"`)
      req.log('error', `Failed to get state for ${JSON.stringify(light)}`)
      continue
    }
    light.state = (result.on) ? 'On' : 'Off'
    light.result = result
    templateData.lights[light.id] = light
  }
  res.render('index', templateData)
})

router.post('/', async function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'))
  }
  let light
  let stayOnMinutes
  let status
  switch (req.body.cmd) {
    case 'create-color-schedule':
      return colorSchedule.create(req, res)

    case 'update-color-schedule':
      return colorSchedule.update(req, res)

    case 'delete-color-schedule':
      return colorSchedule.delete(req, res)

    case 'timer-length':
      stayOnMinutes = parseInt(req.body.minutes)
      if (isNaN(stayOnMinutes)) {
        req.flash('error', `Invalid number input supplied - ${req.body.minutes}`)
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

    case 'remove-lights':
      for (let i = 0; i < req.body.lights.length; i++) {
        light = req.db.lights.get(req.body.lights[i])
        req.db.lights.remove(light)
      }
      req.flash('success', 'Offline lights successfully removed!')
      res.redirect('/')
      return

    case 'default-brightness':
      light = req.db.lights.get(req.body.light)
      light.settings.brightness = req.body.brightness
      req.db.lights.update(light)

      req.flash('success', 'Default brightness has been successfully set for the light!')
      res.redirect('/')
      return

    case 'turn-on-keep-on':
      await lights.turnOn(req.body.light)

      req.flash('success', 'Light has been turned on and will stay on!')
      lights.addLog(req.body.light, `Website turn-on-keep-on for light ${req.body.light}.`)
      break

    case 'turn-on-with-timer':
      await lights.turnOn(req.body.light, {
        timer: true
      })

      req.flash('success', 'Light has been turned on and timer has been started!')
      lights.addLog(req.body.light, `Website turn-on-with-timer for light ${req.body.light}.`)
      break

    case 'turn-off':
      await lights.turnOff(req.body.light)

      req.flash('success', 'Light has been turned off!')
      lights.addLog(req.body.light, `Website turn-off for light ${req.body.light}.`)
      break

    case 'toggle-keep-on':
    case 'toggle-with-timer':
      light = await req.db.lights.get(req.body.light)
      status = await lights.getState(light)
      if (status.on) {
        await lights.turnOff(req.body.light)
        lights.addLog(req.body.light, `Button turn-off for light ${req.body.light}.`)
        res.send('Turned off')
      } else if (req.body.cmd === 'toggle-keep-on') {
        await lights.turnOn(req.body.light)
        lights.addLog(req.body.light, `Button turn-on-keep-on for light ${req.body.light}.`)
        res.send('Turned on, keeping on')
      } else {
        await lights.turnOn(req.body.light, {
          timer: true
        })
        lights.addLog(req.body.light, `Button turn-on-with-timer for light ${req.body.light}.`)
        res.send('Turned on, timer started')
      }
      return

    case 'experiment':
      if (req.body.light) {
        try {
          if (req.body.intend_state === 'on') {
            await lights.turnOn(req.body.light, req.body.settings)
          } else {
            await lights.turnOff(req.body.light)
          }
        } catch (e) {
          req.log('error', e.toString())
        }
      }
      res.send('Success')
      return
  }

  res.redirect('/')
})

module.exports = router
