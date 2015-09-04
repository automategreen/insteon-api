'use strict';

var InsteonAPI = require('../lib/');

var api = new InsteonAPI({key: process.env.INSTEON_API_KEY});

api.on('auth', function() {
  console.log('Connected');
  console.log('Access Token: ' + api.accessToken);
  console.log('Refresh Token: ' + api.refreshToken);
});

api.on('error', function(err) {
  console.log('Error: ', err);
});

api.auth({
 username: process.env.INSTEON_USERNAME,
 password: process.env.INSTEON_PASSWORD
});

// api.connect({ refreshToken: '12345678901234567890123456789012' });