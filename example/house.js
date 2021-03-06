'use strict';

var InsteonAPI = require('../lib/');

var api = new InsteonAPI({key: process.env.INSTEON_API_KEY});

api.on('connect', function() {
  api.house(12345)
  .then(function(house) {
    console.log('House: %s (%d)', house.name, house.id);
    house.name = 'Automate Green Home';
    return house.save();
  });
});

api.on('error', function(err) {
  console.log('Error: ', err);
});

api.connect({
 username: process.env.INSTEON_USERNAME,
 password: process.env.INSTEON_PASSWORD
});

// api.connect({ refreshToken: '12345678901234567890123456789012' });