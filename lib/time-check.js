'use strict'

var moment = require('moment')

module.exports = function (curDate, lowerBound, upperBound) {
  var lowerBoundDate = moment(lowerBound, 'h:ma')
  var upperBoundDate = moment(upperBound, 'h:ma')

  if (lowerBoundDate <= upperBoundDate) {
    return (lowerBoundDate <= curDate && curDate <= upperBoundDate)
  } else {
    return (lowerBoundDate <= curDate || curDate <= upperBoundDate)
  }
}
