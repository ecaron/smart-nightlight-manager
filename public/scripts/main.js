/* global $:false, moment:false, confirm:false */
'use strict'

$(document).ready(function () {
  $('ul.navbar-nav li').each(function (i, elem) {
    if ($('a', elem).attr('href') === window.location.pathname) {
      $(elem).addClass('active')
    }
  })

  if ($('.current-date').length) {
    // Safest way to know we're showing the right timezone
    $('.current-date').html(moment().format('h:mma'))
  }

  setTimeout(function () {
    $('#suggestRefresh').show()
  }, 60 * 1000)
  $('#suggestRefresh').hide()

  $('span.timer-countdown').each(function (i, span) {
    $(span).html(moment($(span).data('time')).fromNow())
  })

  $('button.close').on('click', function () {
    $(this).parents('p').hide()
  })

  if ($('.time-input').length) {
    $('.time-input').timepicker({ disableTextInput: true, disableTouchKeyboard: true, selectOnBlur: true, stopScrollPropagation: true })
  }

  $('.confirm-submit').on('submit', function (e) {
    if (!confirm('Are you sure?')) {
      e.preventDefault()
    }
  })

  $('.expand-log').on('click', function () {
    $(this).parents('.panel').find('.panel-body').removeClass('hide')
    $(this).remove()
  })

  $('#light-experiment').on('submit', function (e) {
    e.preventDefault()
    var data = {
      cmd: 'experiment'
    }
    $.each($(this).serializeArray(), function (i, field) {
      data[field.name] = field.value
    })
    $.ajax({
      type: 'POST',
      url: '/',
      data: data
    })
  })
})
