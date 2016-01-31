var ColorSchedule = {
  create: function (db, req, res) {
    var light = db('lights').find({id: req.body.light});
    req.flash('success', 'Color schedule has been successfully added for the light!');
    var scheduleKey = req.body.start_time + '==' + req.body.end_time;
    var scheduleValue = {
      start: req.body.start_time,
      end: req.body.end_time,
      color: req.body.color
    };

    if (!light) {
      var colorSchedule = {};
      colorSchedule[scheduleKey] = scheduleValue;

      db('lights').push(
        { id: req.body.light,
          colorSchedule: colorSchedule
        }
      );
      return res.redirect('/');
    } else {
      if (!light.colorSchedule) {
        light.colorSchedule = {};
      }
      light.colorSchedule[scheduleKey] = scheduleValue;
      return db.savePromise().then(function () {
        res.redirect('/');
      });
    }
  },
  update: function (db, req, res) {
    var light = db('lights').find({id: req.body.light});
    var scheduleKey = req.body.id;
    var scheduleValue = {
      start: req.body.start_time,
      end: req.body.end_time,
      color: req.body.color
    };

    if (!light || !light.colorSchedule || !light.colorSchedule[scheduleKey]) {
      req.flash('error', 'Unable to load database for that light.');
      return res.redirect('/');
    } else {
      light.colorSchedule[scheduleKey] = scheduleValue;
      return db.savePromise().then(function () {
        req.flash('success', 'Updated schedule for that light.');
        res.redirect('/');
      });
    }
  },
  delete: function (db, req, res) {
    var light = db('lights').find({id: req.body.light});
    var scheduleKey = req.body.id;
    if (!light || !light.colorSchedule || !light.colorSchedule[scheduleKey]) {
      req.flash('error', 'Unable to load database for that light.');
      return res.redirect('/');
    } else {
      req.flash('success', 'Deleted color schedule for that light.');
      delete light.colorSchedule[scheduleKey];
      return db.savePromise().then(function () {
        res.redirect('/');
      });
    }
  }
};

module.exports = ColorSchedule;
