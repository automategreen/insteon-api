'use strict';

var util = require('util');
var events = require('events');
var Q = require('q');
var debug = require('debug')('insteon-api.meter');


function Meter(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Meter, events.EventEmitter);


Meter.prototype.statusAndReset = function (next) {

  var meter = this;

  var deferred = Q.defer();

  deferred.resolve(
    meter.status()
    .then(function (details) {
      return meter.reset()
      .then(function () {
        return details;
      });
    })
  );

  return deferred.promise.nodeify(next);

};

Meter.prototype.reset = function (next) {
  return this.command('imeter_clear', next);
};

Meter.prototype.status = function (next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.command('imeter_status')
    .then(function(rsp) {
      return rsp;
    })
  );
  return deferred.promise.nodeify(next);
};

Meter.prototype.dataHandler = function (data, next) {
  debug('handling data', data.status);
  var deferred = Q.defer();

  this.emit('command', data);

  return deferred.promise.nodeify(next);

};


module.exports = Meter;