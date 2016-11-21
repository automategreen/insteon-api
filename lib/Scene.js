var util = require('util');
var events = require('events');
var Q = require('q');

function Scene(id, api) {
  this.id = id;
  this.api = api;
}

util.inherits(Scene, events.EventEmitter);

Scene.prototype.command = function(command, next) {

  var deferred = Q.defer();

  if(typeof command === 'string') {
    command = {command: command};
  }
  if(typeof command !== 'object' || command === null) {
    deferred.reject(new Error('Invalid command: ' + command));
  }

  command.scene_id = this.id;

  deferred.resolve(this.api.command(command));

  return deferred.promise.nodeify(next);
};

Scene.prototype.turnOn = function (next) {
  return this.command('on', next);
};

Scene.prototype.turnOff = function (rate, next) {
  return this.command('off', next);
};

module.exports = Scene;