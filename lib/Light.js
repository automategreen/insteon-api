var util = require('util');
var events = require('events');
var Q = require('q');


var RAMP_RATES = [
  2000, // shouldn't be used
  480000,
  420000,
  360000,
  300000,
  270000,
  240000,
  210000,
  180000,
  150000,
  120000,
  90000,
  60000,
  47000,
  43000,
  38500,
  34000,
  32000,
  30000,
  28000,
  26000,
  23500,
  21500,
  19000,
  8500,
  6500,
  4500,
  2000,
  500,
  300,
  200,
  100
];

function Light(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Light, events.EventEmitter);


Light.prototype.command = function(command, next) {

  var deferred = Q.defer();

  if(typeof command === 'string') {
    command = {command: command};
  }
  if(typeof command !== 'object' || command === null) {
    deferred.reject(new Error('Invalid command: ' + command));
  }

  command.device_id = this.id;

  deferred.resolve(this.api.command(command));

  return deferred.promise.nodeify(next);
};

Light.prototype.turnOn = function (level, next) {
  if (typeof level === 'function') {
    next = level;
    level = 100;
  } else if (level === undefined || level === null){
    level = 100;
  }

  return this.command({command: 'on', level: level}, next);
};

Light.prototype.turnOnFast = function (next) {
  return this.command('fast_on', next);
};

Light.prototype.turnOff = function (rate, next) {
  return this.command('off', next);
};

Light.prototype.turnOffFast = function (next) {
  return this.command('fast_off', next);
};

Light.prototype.brighten = function (next) {
  return this.command('bright', next);
};

Light.prototype.dim = function (next) {
  return this.command('dim', next);
};


Light.prototype.level = function (level, next) {
  if (typeof level === 'function') {
    next = level;
    level = null;
  }


  if (level !== null && level !== undefined){
    return this.command({command: 'instant_on', level: level}, next);
  } else {
    var deferred = Q.defer();
    deferred.resolve(
      this.command('get_status')
      .then(function(rsp) {
        return rsp.level;
      })
    );
    return deferred.promise.nodeify(next);
  }
};

Light.prototype.info = function (next) {

  var deferred = Q.defer();
  deferred.resolve(
    this.api.device(this.id)
    .then(function(device){
      var rampRate = RAMP_RATES[device.rampRate];
      var onLevel = device.dimLevel * 100 / 255;
      var ledBrightness = device.ledLevel;

      return {
        rampRate: rampRate,
        onLevel: onLevel,
        ledBrightness: ledBrightness
      };
    })
  );
  return deferred.promise.nodeify(next);
};


function lookupRampRateIndex(rate) {

    for(var i = 1; i < RAMP_RATES.length; i++) {
      if (rate >= RAMP_RATES[i]) {
        return i;
      }
    }

    return RAMP_RATES.length - 1;
}

Light.prototype.rampRate = function (rate, next) {

  if (typeof rate === 'function') {
    next = rate;
    rate = null;
  }

  if (rate) {
    rate = lookupRampRateIndex(rate);
    return this.api.device(this.id)
    .then(function(device){
      device.rampRate = rate;
      return device.save();
    });
  }

  return this.info()
  .then(function(info) {
    return info.rampRate;
  });
};

Light.prototype.onLevel = function (btn, level, next) {

  if (typeof level === 'function') {
    next = level;
    level = null;
  }

  if (level) {
    return this.api.device(this.id)
    .then(function(device){
      device.dimLevel = Math.round(level * 255 / 100);
      return device.save();
    });
  }

  return this.info()
  .then(function(info) {
    return info.dimLevel * 100 / 255;
  });
};

Light.prototype.handleStream = function (data) {

  this.emit('command', data);

  switch (data.status) {
  case 'on':
    this.emit('turnOn');
    break;
  case 'off':
    this.emit('turnOff');
    break;
  }
};


module.exports = Light;
