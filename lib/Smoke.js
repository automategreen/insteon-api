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

  switch(data.device_group) {
    case 1:
      this.emit('smoke');
      break;
    case 2:
      this.emit('co');
      break;
    case 3:
      this.emit('test');
      break;
    case 4:
      this.emit('error');
      break;
    case 5:
      this.emit('clear');
      break;
    case 6:
      this.emit('battery');
      break;
    case 7:
      this.emit('error');
      break;
  }

};


module.exports = Leak;