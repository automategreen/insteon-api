'use strict';

var util = require('util');
var events = require('events');
var Q = require('q');
var debug = require('debug')('insteon-api.remote');


function Remote(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Remote, events.EventEmitter);


Remote.prototype.dataHandler = function (data, next) {
  debug('handling data', data.status);
  var deferred = Q.defer();

  this.emit('command', data);

  switch(data.device_group) {
    case 1:
      this.emit('a_' + data.status);
      deferred.resolve(['a_' + data.status]);
      break;
    case 2:
      this.emit('b_' + data.status);
      deferred.resolve(['b_' + data.status]);
      break;
    case 3:
      this.emit('c_' + data.status);
      deferred.resolve(['c_' + data.status]);
      break;
    case 4:
      this.emit('d_' + data.status);
      deferred.resolve(['d_' + data.status]);
      break;
    case 5:
      this.emit('e_' + data.status);
      deferred.resolve(['e_' + data.status]);
      break;
    case 6:
      this.emit('f_' + data.status);
      deferred.resolve(['f_' + data.status]);
      break;
    case 7:
      this.emit('g_' + data.status);
      deferred.resolve(['g_' + data.status]);
      break;
    case 8:
      this.emit('h_' + data.status);
      deferred.resolve(['h_' + data.status]);
      break;
  }
  return deferred.promise.nodeify(next);

};


module.exports = Remote;