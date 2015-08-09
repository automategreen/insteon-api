'use strict';

var InsteonAPI = require('../lib/');

var api = new InsteonAPI({key: process.env.INSTEON_API_KEY});

api.on('error', function(err) {
  console.log('Error: ', err);
});

api.on('command', function (cmd) {
  console.log('House command:', cmd);
});


api.light(608268).on('turnOn', function () {
  console.log('Turned On');
});

api.light(608268).on('turnOff', function () {
  console.log('Turned Off');
});

api.connect({
 username: process.env.INSTEON_USERNAME,
 password: process.env.INSTEON_PASSWORD
});