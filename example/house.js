'use strict';

var InsteonAPI = require('../lib/');

var api = new InsteonAPI({key: process.env.INSTEON_API_KEY});

api.on('connect', function() {
  api.house()
  .then(function(houseList) {
    console.log(houseList);
    houseList.forEach(function (house) {
      api.house(house.HouseID)
      .then(function(houseDetails) {
        console.log(houseDetails);
      });
    });
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