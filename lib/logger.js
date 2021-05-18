/* eslint-disable new-cap */

const winston = require('winston')
const path = require('path')

const logPath = path.join(__dirname, '..', 'logs')
const logger = new (winston.createLogger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({
      name: 'info-file',
      filename: path.resolve(logPath, 'info.log'),
      level: 'info'
    }),
    new (winston.transports.File)({
      name: 'error-file',
      filename: path.resolve(logPath, 'error.log'),
      level: 'error'
    })
  ]
})

logger.stream = {
  write: function (message, encoding) {
    // jshint unused:false

    logger.info(message)
  }
}
module.exports = logger
