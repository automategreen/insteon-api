'use strict';

var util = require('util');
var events = require('events');
var Q = require('q');
var debug = require('debug')('insteon-api.motion');


function Motion(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Motion, events.EventEmitter);


Motion.prototype.dataHandler = function (data, next) {
  debug('handling data', data.status);
  var deferred = Q.defer();

  this.emit('command', data);

  switch(data.device_group + data.status) {
    case '1on':
      this.emit('motion');
      deferred.resolve(['motion']);
      break;
    case '1off':
      this.emit('clear');
      deferred.resolve(['clear']);
      break;
    case '3on':
      this.emit('battery');
      deferred.resolve(['battery']);
      break;
  }
  return deferred.promise.nodeify(next);

};


module.exports = Motion;