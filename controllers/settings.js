'use strict'

const express = require('express')
const router = express.Router()
const db = require('../lib/db')

router.get('/', function (req, res) {
  res.render('settings')
})

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'))
  }
  if (req.body.cmd === 'add-button') {
    const maxEntry = db.get('lights').sortBy('id').reverse().take(1).value()[0]
    const newEntry = {
      id: String(parseInt(maxEntry.id) + 1),
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
    db.get('lights').push(newEntry).write()
  }
  res.redirect('/')
})

module.exports = router
