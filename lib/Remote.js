'use strict';

var util = require('util');
var events = require('events');
var debug = require('debug')('insteon-api.remote');


function Remote(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Remote, events.EventEmitter);


Remote.prototype.dataHandler = function (data) {
  debug('handling data', data.status);

  this.emit('command', data);

  switch(data.device_group) {
    case 1:
      this.emit('a_' + data.status);
      break;
    case 2:
      this.emit('b_' + data.status);
      break;
    case 3:
      this.emit('c_' + data.status);
      break;
    case 4:
      this.emit('d_' + data.status);
      break;
    case 5:
      this.emit('e_' + data.status);
      break;
    case 6:
      this.emit('f_' + data.status);
      break;
    case 7:
      this.emit('g_' + data.status);
      break;
    case 8:
      this.emit('h_' + data.status);
      break;
  }

};


module.exports = Remote;