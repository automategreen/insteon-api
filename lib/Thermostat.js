'use strict';

var util = require('util');
var events = require('events');
var Q = require('q');
var debug = require('debug')('insteon-api.thermostat');


function Thermostat(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Thermostat, events.EventEmitter);

Thermostat.prototype.tempUp = function (change, next) {
  if (typeof change === 'function') {
    next = change;
    change = 1;
  } else if (change === undefined || change === null){
    change = 1;
  }

  return this.command({command: 'temp_up', temp: change}, next);
};

Thermostat.prototype.tempDown = function (change, next) {
  if (typeof change === 'function') {
    next = change;
    change = 1;
  } else if (change === undefined || change === null){
    change = 1;
  }

  return this.command({command: 'temp_down', temp: change}, next);
};

Thermostat.prototype.temp = function (next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.status()
    .then(function(status) {
      return status.temperature;
    })
  );
  return deferred.promise.nodeify(next);
};

Thermostat.prototype.setpoints = function (next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.status()
    .then(function(status) {
      return status.setpoints;
    })
  );
  return deferred.promise.nodeify(next);
};

Thermostat.prototype.humidity = function (next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.status()
    .then(function(status) {
      return status.humidity;
    })
  );
  return deferred.promise.nodeify(next);
};

var MODE_CMDS = {
  off: 'all_off',
  heat: 'heat',
  cool: 'cool',
  auto: 'auto',
  fan: 'fan_on',
  'fan auto': 'fan_auto',
  'program heat': 'prog_heat',
  'program cool': 'prog_cool',
  'program auto': 'prog_auto'
};

Thermostat.prototype.mode = function (mode, next) {
  if(typeof mode === 'function') {
    next = mode;
    mode = null;
  }

  if(mode) {
    return this.command(MODE_CMDS[mode.toLowerCase()], next);
  } else {
    var deferred = Q.defer();
    deferred.resolve(
      this.status()
      .then(function(status) {
        return status.mode;
      })
    );
    return deferred.promise.nodeify(next);
  }
};

Thermostat.prototype.coolTemp = function (temp, next) {
  return this.command({command: 'set_cool_to', temp: temp}, next);
};

Thermostat.prototype.heatTemp = function (temp, next) {
  return this.command({command: 'set_heat_to', temp: temp}, next);
};

Thermostat.prototype.status = function (next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.command('get_status')
    .then(function(rsp) {
      var status = rsp.response;

      // insteon returns humidity as a string %, example "62%"
      var h = status.humidity;
      h = +h.substring(0, h.length - 1);

      return {
        mode: status.mode,
        fan: status.fan === 'fan_on',
        unit: status.mode.toUpperCase(),
        temperature: status.ambient,
        humidity: h,
        setpoints: {
          cool: status.cool_point,
          heat: status.heat_point
        }
      };
    })
  );
  return deferred.promise.nodeify(next);
};


var ON_EVENTS = ['cooling', 'heating', 'highHumidity', 'lowHumidity'];
Thermostat.prototype.dataHandler = function (data) {
  debug('handling data', data.status);

  this.emit('command', data);

  switch(data.status) {
  case 'on':
    this.emit(ON_EVENTS[data.device_group-1]);
    break;
  case 'off':
    if(data.group >= 3) {
      this.emit('normalHumidity');
    } else {
      this.emit('off');
    }
    break;
  }


};


module.exports = Thermostat;