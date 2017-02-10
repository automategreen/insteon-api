'use strict';

var util = require('util');
var events = require('events');
var Q = require('q');

var debug = require('debug')('insteon-api.door');


function Door(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Door, events.EventEmitter);


Door.prototype.dataHandler = function (data, next) {
  debug('handling data', data.status);
  var deferred = Q.defer();


  this.emit('command', data);

  switch(data.device_group + data.status) {
    case '1on':
      this.emit('opened');
      deferred.resolve(['opened']);
      break;
    case '2on':
    case '1off':
      this.emit('closed');
      deferred.resolve(['closed']);
      break;
    case '3on':
      this.emit('battery');
      deferred.resolve(['battery']);
      break;
    case '4on':
      this.emit('heartbeat');
      this.emit('opened');
      deferred.resolve(['heartbeat', 'opened']);
      break;
    case '4off':
      this.emit('heartbeat');
      this.emit('closed');
      deferred.resolve(['heartbeat', 'opened']);
      break;
  }

  return deferred.promise.nodeify(next);
};


module.exports = Door;