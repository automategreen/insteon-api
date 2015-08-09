'use strict';

var util = require('util');
var events = require('events');
var debug = require('debug')('insteon-api.leak');


function Leak(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Leak, events.EventEmitter);


Leak.prototype.dataHandler = function (data) {
  debug('handling data', data.status);

  this.emit('command', data);

  switch(data.device_group + data.status) {
    case '1on':
      this.emit('dry');
      break;
    case '2on':
      this.emit('wet');
      break;
    case '4on':
      this.emit('heartbeat');
      this.emit('dry');
      break;
    case '4off':
      this.emit('heartbeat');
      this.emit('wet');
      break;
  }

};


module.exports = Leak;