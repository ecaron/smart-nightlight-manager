exports.index = function (req, res) {
  const values = {
    curPage: 'overview'
  }
  res.render('index', values)
}
exports.settings = function (req, res) {
  const values = {
    curPage: 'settings'
  }
  res.render('settings', values)
}
