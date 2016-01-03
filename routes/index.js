'use strict';

exports.index = function (req, res) {
  var values = {
    curPage: 'overview'
  };
  res.render('index', values);
};
exports.settings = function (req, res) {
  var values = {
    curPage: 'settings'
  };
  res.render('settings', values);
};
