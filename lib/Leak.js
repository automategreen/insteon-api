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

  switch(data.device_group + data.status) {
    case '1on':
      this.emit('dry');
      deferred.resolve(['dry']);
      break;
    case '2on':
      this.emit('wet');
      deferred.resolve(['wet']);
      break;
    case '4on':
      this.emit('heartbeat');
      this.emit('dry');
      deferred.resolve(['heartbeat', 'dry']);
      break;
    case '4off':
      this.emit('heartbeat');
      this.emit('wet');
      deferred.resolve(['heartbeat', 'wet']);
      break;
  }
  return deferred.promise.nodeify(next);

};


module.exports = Leak;