const moment = require('moment')

module.exports = function (curDate, lowerBound, upperBound) {
  const lowerBoundDate = moment(lowerBound, 'h:ma')
  const upperBoundDate = moment(upperBound, 'h:ma')

  if (lowerBoundDate <= upperBoundDate) {
    return (lowerBoundDate <= curDate && curDate <= upperBoundDate)
  } else {
    return (lowerBoundDate <= curDate || curDate <= upperBoundDate)
  }
}
