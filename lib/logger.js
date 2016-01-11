'use strict';

var winston = require('winston');
var path = require('path');

var logPath = path.join(__dirname, '..', 'logs');
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({
      name: 'info-file',
      filename: logPath + '/info.log',
      level: 'info'
    }),
    new (winston.transports.File)({
      name: 'error-file',
      filename: logPath + '/error.log',
      level: 'error'
    })
  ]
});

logger.stream = {
  write: function(message, encoding){
    //jshint unused:false

    //Skip the skipLog messages (hacky)
    if (message.indexOf('skipLog') !== -1) {
      return;
    }

    logger.info(message);
  }
};
module.exports = logger;
