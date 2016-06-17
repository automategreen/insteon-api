'use strict';

var util = require('util');
var events = require('events');
var Q = require('q');
var debug = require('debug')('insteon-api.lock');


function Lock(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Lock, events.EventEmitter);


Lock.prototype.dataHandler = function (data) {
  debug('handling data', data.status);

  this.emit('command', data);

  switch(data.status) {
    case 'on':
      this.emit('locked');
      break;
    case 'off':
      this.emit('unlocked');
      break;
  }
};

Lock.prototype.command = function(command, next) {

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

Lock.prototype.lock = function (next) {
  return this.command({command: 'on', level: 100}, next);
};

Lock.prototype.unlock = function (rate, next) {
  return this.command({command: 'on', level: 0}, next);
};

// Not supported by Insteon API

// Lock.prototype.locked = function (next) {
//   var deferred = Q.defer();
//   deferred.resolve(
//     this.command('get_status')
//     .then(function(rsp) {
//       return !!rsp.level;
//     })
//   );
//   return deferred.promise.nodeify(next);
// };

// Lock.prototype.unlocked = function (next) {
//   var deferred = Q.defer();
//   deferred.resolve(
//     this.command('get_status')
//     .then(function(rsp) {
//       return !rsp.level;
//     })
//   );
//   return deferred.promise.nodeify(next);
// };


module.exports = Lock;