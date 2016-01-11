/*global $:false */
'use strict';
$('ul.navbar-nav li').each(function (i, elem) {
  if ($('a', elem).attr('href') === window.location.pathname) {
    $(elem).addClass('active');
  }
});
$('.color-box').on('change', function(){
  var hexColor = $(this).val();
  $(this).css({backgroundColor: hexColor, color: hexColor});
}).trigger('change');