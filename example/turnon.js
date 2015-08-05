'use strict';

var InsteonAPI = require('../lib/');

var api = new InsteonAPI({key: process.env.INSTEON_API_KEY});

api.on('connect', function() {
  api.light(12345).turnOn()
  .then(function(rsp) {
    console.log('Turned On: ', rsp);
  });
});

api.on('error', function(err) {
  console.log('Error: ', err);
});

api.connect({
 username: process.env.INSTEON_USERNAME,
 password: process.env.INSTEON_PASSWORD
});