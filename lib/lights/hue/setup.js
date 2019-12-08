const hue = require('node-hue-api').v3

const APPLICATION_NAME = process.env.SITE_NAME || 'Nightlight System'
const DEVICE_NAME = 'Web Interface'

module.exports = async function (req, res) {
  let setting = req.db.settings.findOne({ type: 'hue' })
  if (setting) {
    throw new Error('Hue bridge already exists in the local database')
  }
  setting = {
    type: 'hue'
  }

  return hue.discovery.nupnpSearch()
    .then(searchResults => {
      if (searchResults.length === 0) {
        throw new Error('No bridges found')
      }
      req.log('info', `${searchResults.length} Hue Bridges Found`)
      setting.ip = searchResults[0].ipaddress
      return hue.api.createLocal(setting.ip).connect()
    })
    .then(api => {
      return api.users.createUser(APPLICATION_NAME, DEVICE_NAME)
    })
    .then(createdUser => {
      req.flash('success', 'Hue Bridge successfully found and saved to database')
      req.log('info', 'User successfully created on local bridge')
      setting.username = createdUser
      req.db.settings.insert(setting)
    }).catch(e => {
      req.flash('error', e.toString())
    })
}
