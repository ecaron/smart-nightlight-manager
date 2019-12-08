/* eslint new-cap: ["error", { "newIsCap": false }] */
const EventEmitter = require('events')
const loki = require('lokijs')
const path = require('path')
const fs = require('fs')
const oldDbFile = path.resolve(__dirname, '..', 'config', 'db.json')
const newDbFile = path.resolve(__dirname, '..', 'config', 'db2.json')

const dbEmitter = new EventEmitter()

const DB = new loki(newDbFile, {
  autoload: true,
  autoloadCallback: databaseInitialize,
  autosave: true,
  autosaveInterval: 4000
})

function databaseInitialize () {
  exports.lights = DB.getCollection('lights') || DB.addCollection('lights')
  exports.settings = DB.getCollection('settings') || DB.addCollection('settings')
  if (fs.existsSync(oldDbFile)) {
    const oldDbData = require(oldDbFile)
    exports.settings.insert({ type: 'hue', ip: oldDbData.bridge[0].ip, username: oldDbData.bridge[0].username })
    oldDbData.lights.forEach(origLight => {
      const light = {
        type: 'hue',
        deviceId: origLight.id,
        colorSchedule: origLight.colorSchedule || {},
        settings: origLight.settings || {}
      }
      exports.lights.insert(light)
    })
    fs.unlinkSync(oldDbFile)
  }
  dbEmitter.emit('loaded')
}

exports.close = function () {
  DB.close()
}

exports.save = function () {
  DB.saveDatabase()
}

exports.event = dbEmitter
