require('dotenv').config()

const fs = require('fs')
const HueApi = require('node-hue-api').v3
const jsonfile = require('jsonfile')

const APPLICATION_NAME = process.env.SITE_NAME || 'Nightlight System'
const DEVICE_NAME = 'Web Interface'

if (fs.existsSync('./config/db.json')) {
  console.warn('setup cannot be run if config/db.json already exists.')
  console.warn('Please delete the file if you are trying to do a fresh install.')
  process.exit(1)
}

const databaseModel = {
  bridge: [],
  lights: []
}

HueApi.discovery.nupnpSearch()
  .then(searchResults => {
    if (searchResults.length === 0) {
      throw new Error('No bridges found')
    }
    console.log(`${searchResults.length} Hue Bridges Found`)
    const host = searchResults[0].ipaddress
    databaseModel.bridge.push({
      ip: searchResults[0].ipaddress
    })
    return HueApi.api.createLocal(host).connect()
  })
  .then(api => {
    return api.users.createUser(APPLICATION_NAME, DEVICE_NAME)
  })
  .then(createdUser => {
    console.log('User successfully created on local bridge')
    databaseModel.bridge[0].username = createdUser
    jsonfile.writeFile('./config/db.json', databaseModel, function (err) {
      if (err) {
        console.error(err)
      } else {
        console.log('Database is setup. You may run "npm start"')
      }
    })
  })
  .catch(err => {
    if (typeof err.getHueErrorType !== 'undefined' && err.getHueErrorType() === 101) {
      console.error('You need to press the Link Button on the bridge first.')
    } else {
      console.error(`Unexpected Error: ${err.message}`)
    }
  })
