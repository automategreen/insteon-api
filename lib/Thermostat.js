'use strict';

var util = require('util');
var events = require('events');
var debug = require('debug')('insteon-api.thermostat');


function Thermostat(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Thermostat, events.EventEmitter);


Thermostat.prototype.dataHandler = function (data) {
  debug('handling data', data.status);

  this.emit('command', data);

};


module.exports = Thermostat;