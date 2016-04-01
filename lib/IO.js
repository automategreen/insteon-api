'use strict';

var util = require('util');
var events = require('events');
var debug = require('debug')('insteon-api.io');


function IO(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(IO, events.EventEmitter);


IO.prototype.dataHandler = function (data) {
  debug('handling data', data.status);

  this.emit('command', data);

  switch(data.status) {
    case 'on':
      this.emit('opened');
      break;
    case 'off':
      this.emit('closed');
      break;
  }
};

IO.prototype.command = function(command, next) {

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

IO.prototype.turnOn = function (next) {
  return this.command('on', next);
};

IO.prototype.turnOff = function (rate, next) {
  return this.command('off', next);
};

// status command do not work - ticket open with Insteon

// get_relay_status  Gets the current status of the relay part of the device
// get_sensor_status Gets the current status of the sensor of the device

// IO.prototype.relayStatus = function (next) {
//   var deferred = Q.defer();
//   deferred.resolve(
//     this.command('get_relay_status')
//     .then(function(rsp) {
//       return !!rsp.level;
//     })
//   );
//   return deferred.promise.nodeify(next);
// };

// IO.prototype.sensorStatus = function (next) {
//   var deferred = Q.defer();
//   deferred.resolve(
//     this.command('get_sensor_status')
//     .then(function(rsp) {
//       return !!rsp.level;
//     })
//   );
//   return deferred.promise.nodeify(next);
// };


module.exports = IO;