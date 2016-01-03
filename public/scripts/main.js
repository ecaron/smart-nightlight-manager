'use strict';
$('ul.navbar-nav li').each(function(i, elem){
  if ($('a', elem).attr('href') === window.location.pathname) {
    $(elem).addClass('active');
  }
});