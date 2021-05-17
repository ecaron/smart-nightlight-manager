require('dotenv').config()
const pkg = require('./package')
const express = require('express')
const session = require('express-session')
const flash = require('connect-flash')
const nunjucks = require('nunjucks')
const path = require('path')

const db = require('./lib/db')

process.on('uncaughtException', function (err) {
  if (process.env.NODE_ENV === 'production') {
    console.log(err)
  } else {
    throw err
  }
})

const logger = require('./lib/logger')
const lightWatcher = require('./lib/light-watcher')

const app = express()
const port = process.env.PORT || 3000

app.set('views', path.resolve(__dirname, 'views'))
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: (process.env.NODE_ENV !== 'production')
})
app.set('view engine', 'html')

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  cookie: { maxAge: 60000, sameSite: true },
  resave: true,
  saveUninitialized: true
}))
app.use(flash())

app.use('/scripts/flatpickr/', express.static('node_modules/flatpickr/dist'))
app.use('/scripts/moment/', express.static('node_modules/moment'))
app.use('/css/icons/', express.static('node_modules/bootstrap-icons/font'))
app.use(express.static('public'))

app.use(function (req, res, next) {
  const render = res.render
  req.db = db
  req.log = function (type, message, meta) {
    if (typeof meta !== 'object') {
      meta = {}
    }
    meta.method = req.method
    meta.url = req.originalUrl
    meta.ip = req.ip
    if (typeof logger[type] !== 'undefined') {
      logger[type](message, meta)
    } else {
      logger.error('Failed attempt to invoke logger with type "' + type + '"')
      logger.info(message, meta)
    }
  }

  res.locals.site_name = process.env.SITE_NAME || 'Nightlight System'
  res.render = function (view, locals, cb) {
    res.locals.success_messages = req.flash('success')
    res.locals.error_messages = req.flash('error')
    if (typeof locals === 'object') locals.user = req.user
    render.call(res, view, locals, cb)
  }
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(require('morgan')('combined', { stream: logger.stream }))
app.use(require('./controllers'))

app.use(function (err, req, res, next) {
  // jshint unused:false
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.use(function (req, res, next) {
  // jshint unused:false
  res.status(404).send('Sorry cant find that!')
})

db.event.on('loaded', function () {
  app.listen(port, function () {
    console.log(`Started ${pkg.name}. Listening on port ${port}`)
  })

  lightWatcher.init()
})
