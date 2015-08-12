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
    this.command('temp')
    .then(function(rsp) {
      return rsp.temp;
    })
  );
  return deferred.promise.nodeify(next);
};

Thermostat.prototype.setpoints = function (next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.command('setpoint')
    .then(function(rsp) {
      return rsp.setpoint;
    })
  );
  return deferred.promise.nodeify(next);
};

Thermostat.prototype.humidity = function (next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.command('humidity')
    .then(function(rsp) {
      return rsp.humidity;
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
      this.command('mode')
      .then(function(rsp) {
        return rsp.mode;
      })
    );
    return deferred.promise.nodeify(next);
  }
};

Thermostat.prototype.coolTemp = function (temp, next) {
  return this.command({command: 'cool_set', temp: temp}, next);
};

Thermostat.prototype.heatTemp = function (temp, next) {
  return this.command({command: 'heat_set', temp: temp}, next);
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