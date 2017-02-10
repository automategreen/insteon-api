'use strict';

var util = require('util');
var events = require('events');
var Q = require('q');
var debug = require('debug')('insteon-api.leak');


function Leak(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Leak, events.EventEmitter);


Leak.prototype.dataHandler = function (data, next) {
  debug('handling data', data.status);
  var deferred = Q.defer();

  this.emit('command', data);

  switch(data.device_group) {
    case 1:
      this.emit('smoke');
      deferred.resolve(['smoke']);
      break;
    case 2:
      this.emit('co');
      deferred.resolve(['co']);
      break;
    case 3:
      this.emit('test');
      deferred.resolve(['test']);
      break;
    case 4:
      this.emit('error');
      deferred.resolve(['error']);
      break;
    case 5:
      this.emit('clear');
      deferred.resolve(['clear']);
      break;
    case 6:
      this.emit('battery');
      deferred.resolve(['battery']);
      break;
    case 7:
      this.emit('error');
      deferred.resolve(['error']);
      break;
  }
  return deferred.promise.nodeify(next);

};


module.exports = Leak;