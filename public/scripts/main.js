/* global $:false, moment:false, confirm:false */

$(document).ready(function () {
  $('ul.navbar-nav li a').each(function (i, elem) {
    if ($(elem).attr('href') === window.location.pathname) {
      $(elem).addClass('active')
    }
  })

  $('.expand-log').click(function () {
    if ($(this).hasClass('bi-plus-circle')) {
      $(this).removeClass('bi-plus-circle').addClass('bi-dash-circle')
    } else {
      $(this).removeClass('bi-dash-circle').addClass('bi-plus-circle')
    }
  })

  if ($('.current-date').length) {
    // Safest way to know we're showing the right timezone
    $('.current-date').html(moment().format('h:mma'))
  }

  if ($('.time-picker').length) {
    $('.time-picker').flatpickr({ enableTime: true, noCalendar: true, dateFormat: 'h:i K' })
  }

  $('.form-select[name="state"]').change(function () {
    if ($(this).val() === 'off') {
      $(this).parents('form').find('.color-btn').hide()
      $(this).parents('form').find('.time-picker[name="end_time"]').hide()
    } else {
      $(this).parents('form').find('.color-btn').show()
      $(this).parents('form').find('.time-picker[name="end_time"]').show()
    }
  })
  $('.form-select[name="state"]').each(function (i, elem) {
    $(elem).change()
  })

  setTimeout(function () {
    $('#suggestRefresh').show()
  }, 60 * 1000)
  $('#suggestRefresh').hide()

  $('span.timer-countdown').each(function (i, span) {
    $(span).html(moment($(span).data('time')).fromNow())
  })

  $('button.btn-close').on('click', function () {
    $(this).parents('p').hide()
  })

  $('.confirm-submit').on('submit', function (e) {
    if (!confirm('Are you sure?')) {
      e.preventDefault()
    }
  })

  $('#configure-hue').on('submit', function (e) {
    if (!confirm('Did you already click the physical button on your Hue Bridge?')) {
      e.preventDefault()
    }
  })

  $('.light-experiment').on('submit', function (e) {
    e.preventDefault()
    const data = {
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
