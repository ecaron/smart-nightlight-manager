const moment = require('moment')

const isBetween = function (curDate, lowerBound, upperBound) {
  const lowerBoundDate = moment(lowerBound, 'h:ma')
  const upperBoundDate = moment(upperBound, 'h:ma')

  if (lowerBoundDate <= upperBoundDate) {
    return (lowerBoundDate <= curDate && curDate <= upperBoundDate)
  } else {
    return (lowerBoundDate <= curDate || curDate <= upperBoundDate)
  }
}

exports.schedulePicker = function (light) {
  const schedules = Object.values(light.colorSchedule)
  const curDate = moment()
  let closestTime = moment().add(1, 'd')
  let lightSettings = false

  // Determine what schedule currently applies based on newest set
  // or most time remaining
  let schedule
  for (let i = 0; i < schedules.length; i++) {
    schedule = schedules[i]

    if (!schedule.start) continue

    schedule.actualStart = moment(schedule.start, 'h:ma')
    schedule.actualEnd = moment(schedule.end, 'h:ma')
    if (schedule.actualEnd < curDate) {
      schedule.actualEnd.add(1, 'd')
    }
    schedule.nextStart = moment(schedule.start, 'h:ma')
    if (schedule.nextStart < curDate) {
      schedule.nextStart.add(1, 'd')
    }

    // Watch the next time a change happens
    if (schedule.nextStart < closestTime) closestTime = schedule.nextStart
    if (schedule.actualEnd < closestTime) closestTime = schedule.actualEnd

    if (isBetween(curDate, schedule.start, schedule.end)) {
      if (lightSettings === false) {
        lightSettings = schedule
      } else {
        if (lightSettings.start !== schedule.start) {
          if (schedule.actualStart > lightSettings.actualStart) {
            lightSettings = schedule
          }
        } else if (lightSettings.actualEnd < schedule.actualEnd) {
          lightSettings = schedule
        }
      }
    } else if (schedule.state === 'off' && curDate.format('h:mm a') === schedule.start) {
      lightSettings = schedule
    }
  }

  return { lightSettings, closestTime }
}
