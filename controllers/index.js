'use strict'

var express = require('express')
var async = require('async')
var router = express.Router()
var bridge = require('../lib/bridge')
var db = require('../lib/db')
var hex2rgb = require('../lib/hex2rgb')
var colorSchedule = require('../lib/color-schedule')

router.use('/settings', require('./settings'))

router.get('/', function (req, res, next) {
  bridge.api.lights(function (err, data) {
    if (err) {
      return next(err)
    }

    var templateData = {}
    templateData.colors = require('../lib/colors')
    templateData.lights = {}
    async.each(data.lights, function (light, callback) {
      bridge.api.lightStatus(light.id, function (err, result) {
        if (err) {
          return next(err)
        }
        var dbLight = db.get('lights').find({ id: light.id }).value()
        light.state = (result.state.on) ? 'On' : 'Off'
        light.result = result
        light.logs = bridge.lights[light.id].log
        if (bridge.lights[light.id].timer) {
          light.timerTime = bridge.lights[light.id].timerTime.toString()
        }

        light.settings = {}
        if (typeof dbLight === 'object' && dbLight.settings) {
          light.settings = dbLight.settings
        }

        light.colorSchedule = {}
        if (typeof dbLight === 'object' && dbLight.colorSchedule) {
          light.colorSchedule = dbLight.colorSchedule
        }

        templateData.lights[light.id] = light
        return callback()
      })
    }, function () {
      res.render('index', templateData)
    })
  })
})

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'))
  }
  var light
  switch (req.body.cmd) {
    case 'create-color-schedule':
      return colorSchedule.create(db, req, res)

    case 'update-color-schedule':
      return colorSchedule.update(db, req, res)

    case 'delete-color-schedule':
      return colorSchedule.delete(db, req, res)

    case 'timer-length':
      light = db.get('lights').find({ id: req.body.light }).value()
      req.flash('success', 'Timer has been successfully set for the light!')
      if (!light) {
        db.get('lights').push(
          {
            id: req.body.light,
            settings: {
              stayOnMinutes: req.body.minutes
            }
          }
        ).write()
        res.redirect('/')
      } else {
        if (!light.settings) {
          light.settings = {}
        }
        light.settings.stayOnMinutes = req.body.minutes
        db.write()
        res.redirect('/')
      }
      return

    case 'default-color':
      req.flash('success', 'Default color has been successfully set for the light!')
      light = db.get('lights').find({ id: req.body.light }).value()
      if (!light) {
        db.get('lights').push(
          {
            id: req.body.light,
            settings: {
              color: req.body.color
            }
          }
        ).write()
        res.redirect('/')
      } else {
        if (!light.settings) {
          light.settings = {}
        }
        light.settings.color = req.body.color
      }
      db.write()
      res.redirect('/')
      return

    case 'turn-on-keep-on':
      req.flash('success', 'Light has been turned on and will stay on!')
      req.log('info', 'Turning on light for ' + req.body.light)
      bridge.lights[req.body.light].turnOn()
      break

    case 'turn-on-with-timer':
      req.flash('success', 'Light has been turned on and timer has been started!')
      bridge.lights[req.body.light].turnOnWithTimer()
      break

    case 'turn-off':
      req.flash('success', 'Light has been turned off!')
      bridge.lights[req.body.light].turnOff()
      break

    case 'toggle-keep-on':
    case 'toggle-with-timer':
      bridge.api.lightStatus(req.body.light, function (err, result) {
        if (err) {
          return next(err)
        }
        if (result.state.on) {
          bridge.lights[req.body.light].turnOff()
          res.send('Turned off')
        } else if (req.body.cmd === 'toggle-keep-on') {
          bridge.lights[req.body.light].turnOn()
          res.send('Turned on, keeping on')
        } else {
          bridge.lights[req.body.light].turnOnWithTimer()
          res.send('Turned on, timer started')
        }
      })
      return

    case 'experiment':
      if (req.body.light) {
        var state = bridge.lightState.create()
        if (req.body.intend_state === 'on') {
          state.on()
          state.brightness(req.body.brightness)
          state.rgb(hex2rgb(req.body.color))
        } else {
          state.off()
        }
        bridge.api.setLightState(req.body.light, state, function (err, lights) {
          if (err) console.log(err)
        })
      }
      res.send('Success')
      return
  }

  res.redirect('/')
})

module.exports = router
