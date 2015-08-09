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

};


module.exports = IO;