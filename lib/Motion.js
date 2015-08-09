'use strict';

var util = require('util');
var events = require('events');
var debug = require('debug')('insteon-api.motion');


function Motion(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Motion, events.EventEmitter);


Motion.prototype.dataHandler = function (data) {
  debug('handling data', data.status);

  this.emit('command', data);

  switch(data.device_group + data.status) {
    case '1on':
      this.emit('motion');
      break;
    case '1off':
      this.emit('clear');
      break;
    case '3on':
      this.emit('battery');
      break;
  }

};


module.exports = Motion;