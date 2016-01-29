var HueApi = require("node-hue-api");
var async = require('async');
var jsonfile = require('jsonfile');

var timeout = 5000; // 5 seconds
if (process.env.TIMEOUT) {
  timeout = process.env.TIMEOUT * 1000;
}

var databaseModel = {
  "buttons": [],
  "bridge": [],
  "lights": []
};

var displayBridges = function(bridge) {
  if (bridge.length === 0) {
    console.warn("No bridges found. Do you need to set/create the TIMEOUT environment variable?");
    return;
  }
  console.log("Hue Bridges Found: " + JSON.stringify(bridge));
  var hue = new HueApi.HueApi();
  var newUser = false;

  async.whilst(
    function() { return newUser === false; },
    function(callback){
      hue.createUser(bridge[0].ipaddress, function(err, user) {
        if (err) {
          if (err.message === 'link button not pressed') {
            console.log("Bridge button has not been pressed. Pausing 5 seconds while you press it...");
            setTimeout(callback, 5 * 1000);
          } else {
            return callback(err);
          }
        } else {
          newUser = user;
          return callback();
        }
      });
    },
    function(err){
      if (err) {
        console.warn(err.message);
        return;
      }
      databaseModel.bridge.push({ip: bridge[0].ipaddress, username: newUser});
      jsonfile.writeFile('./config/db2.json', databaseModel, function (err) {
        if (err) {
          console.error(err);
        } else {
          console.log("Database is setup. You may run 'npm start'");
        }
      });
    }
  );
};

HueApi.upnpSearch(timeout).then(displayBridges).done();
