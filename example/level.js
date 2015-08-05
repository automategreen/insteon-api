'use strict';

var InsteonAPI = require('../lib/');

var api = new InsteonAPI({key: process.env.INSTEON_API_KEY});

api.on('connect', function() {
  api.light(12345).level(67)
  .then(function(rsp) {
    console.log('Set level: ', rsp);
  });
});

api.on('error', function(err) {
  console.log('Error: ', err);
});

api.connect({
 username: process.env.INSTEON_USERNAME,
 password: process.env.INSTEON_PASSWORD
});