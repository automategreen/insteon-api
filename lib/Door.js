'use strict';

var util = require('util');
var events = require('events');
var debug = require('debug')('insteon-api.door');


function Door(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Door, events.EventEmitter);


Door.prototype.dataHandler = function (data) {
  debug('handling data', data.status);

  this.emit('command', data);

  switch(data.device_group + data.status) {
    case '1on':
      this.emit('opened');
      break;
    case '2on':
    case '1off':
      this.emit('closed');
      break;
    case '3on':
      this.emit('battery');
      break;
    case '4on':
      this.emit('heartbeat');
      this.emit('opened');
      break;
    case '4off':
      this.emit('heartbeat');
      this.emit('closed');
      break;
  }
};


module.exports = Door;