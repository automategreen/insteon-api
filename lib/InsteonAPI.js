'use strict';
var util = require('util');
var extend = util._extend;
var events = require('events');
var request = require('request');
var Q = require('q');

var debug = require('debug')('insteon-api');

var Resource = require('./Resource');
var Light = require('./Light');

function InsteonAPI(options) {
  debug('creating api with options', options);

  this.baseUrl = 'https://connect.insteon.com/api/v2';
  this.commandTries = 10;
  this.commandWait = 1000; //ms

  extend(this, options);

  if(!this.key) {
    throw new Error('key is required.');
  }

  this.request = request.defaults({
    baseUrl: this.baseUrl,
    json: true
  });

  this.__devices = {};
}

util.inherits(InsteonAPI, events.EventEmitter);

InsteonAPI.prototype.connect = function(options) {
  options = options || {};

  var data = {client_id: this.key};

  if(options.username && options.password) {
    data.username = options.username;
    data.password = options.password;
    data.grant_type = 'password';
  } else if(options.refreshToken) {
    data.refresh_token = options.refreshToken;
    data.grant_type = 'refresh_token';
  } else {
    throw new Error('Invalid connect options');
  }

  var api = this;
  this.request.post({
    url: '/oauth2/token',
    body: data
  }, function (err, rsp, body) {
    if(err) {
      api.emit('error', err);
      return;
    }
    if((rsp || {}).statusCode !== 200) {
      api.emit('error', body);
      return;
    }

    api.accessToken = body.access_token;
    api.refreshToken = body.refresh_token;


    api.request = api.request.defaults({
      headers: {
        'Authorization': 'Bearer ' + api.accessToken,
        'Authentication': 'APIKey ' + api.key
      }
    });

    api.emit('connect');
  });
};

var requestHandler = function (deferred, transform) {
  return function (err, rsp, body) {
    if(err) {
      debug('Response error', err);
      deferred.reject(err);
      return;
    }
    debug('Resposne (%d): %j', rsp.statusCode, body);
    if(rsp.statusCode < 200 || rsp.statusCode >= 300) {
      deferred.reject(body);
      return;
    }
    if(transform) {
      body = transform(body);
    }
    deferred.resolve(body);
  };
};

InsteonAPI.prototype.get = function (url, transform, next) {
  var deferred = Q.defer();
  this.request.get(url, requestHandler(deferred, transform));
  return deferred.promise.nodeify(next);
};

InsteonAPI.prototype.put = function(url, data, next) {
  var deferred = Q.defer();
  this.request.put({url: url, body: data}, requestHandler(deferred));
  return deferred.promise.nodeify(next);
};

InsteonAPI.prototype.post = function(url, data, next) {
  var deferred = Q.defer();
  debug('request.post: url = %s, data = %j', url, data);
  this.request.post({url: url, body: data}, requestHandler(deferred));
  return deferred.promise.nodeify(next);
};

InsteonAPI.prototype.del = function(url, next) {
  var deferred = Q.defer();
  this.request.del(url, requestHandler(deferred));
  return deferred.promise.nodeify(next);
};

InsteonAPI.prototype.resource = function(Class, type, properties, id, next) {

  if(typeof id === 'function') {
    next = id;
    id = null;
  }

  if(id && typeof id === 'object') {
    var resource = new Class(this, type, properties, id);
    return resource.save();
  }

  id = id ? ('/' + id) : '?properties=all';

  var resourceList =
    type.charAt(0).toUpperCase() +
    type.slice(1) +
    'List';

  var api = this;

  var transform = function (body) {
    if((body || {})[resourceList]) {
      return body[resourceList].map(function (data) {
        return new Class(api, type, properties, data);
      });
    }
    return new Class(api, type, properties, body);
  };

  return this.get('/' + type + 's' + id, transform, next);
};


var houseProperties = {
  id: {name: 'HouseID', editable: false},
  name: {name: 'HouseName', editable: true},
  insteonAddress: {name: 'InsteonHubID', editable: true},
  binVer: {name: 'BinVer', editable: false},
  plmVer: {name: 'PLMVer', editable: false},
  firmwareVer: {name: 'FirmwareVer', editable: false},
  ip: {name: 'IP', editable: false},
  port: {name: 'Port', editable: false},
  gateway: {name: 'Gateway', editable: false},
  mask: {name: 'Mask', editable: false},
  mac: {name: 'Mac', editable: false},
  location: {name: 'City', editable: true},
  dhcp: {name: 'DHCP', editable: true},
  daylightSavings: {name: 'DaylightSavings', editable: true},
  hubUsername: {name: 'HubUsername', editable: false},
  hubPassword: {name: 'HubPassword', editable: false},
  hubType: {name: 'HubType', editable: false}
};

var deviceProperties = {
  houseID: {name: 'HouseID', editable: true},
  id: {name: 'DeviceID', editable: true},
  name: {name: 'DeviceName', editable: true},
  iconID: {name: 'IconID', editable: true},
  alertOff: {name: 'AlertOff', editable: true},
  alertOn: {name: 'AlertOn', editable: true},
  alertsEnabled: {name: 'AlertsEnabled', editable: true},
  autoStatus: {name: 'AutoStatus', editable: true},
  beepOnPress: {name: 'BeepOnPress', editable: true},
  blinkOnTraffic: {name: 'BlinkOnTraffic', editable: true},
  configuredGroups: {name: 'ConfiguredGroups', editable: true},
  customOff: {name: 'CustomOff', editable: true},
  customOn: {name: 'CustomOn', editable: true},
  dayMask: {name: 'DayMask', editable: true},
  devCat: {name: 'DevCat', editable: true},
  deviceType: {name: 'DeviceType', editable: true},
  dimLevel: {name: 'DimLevel', editable: true},
  enableCustomOff: {name: 'EnableCustomOff', editable: true},
  enableCustomOn: {name: 'EnableCustomOn', editable: true},
  favorite: {name: 'Favorite', editable: true},
  firmwareVersion: {name: 'FirmwareVersion', editable: true},
  group: {name: 'Group', editable: true},
  humidity: {name: 'Humidity', editable: true},
  insteonEngine: {name: 'InsteonEngine', editable: true},
  insteonID: {name: 'InsteonID', editable: true},
  ledLevel: {name: 'LEDLevel', editable: true},
  linkWithHub: {name: 'LinkWithHub', editable: true},
  localProgramLock: {name: 'LocalProgramLock', editable: true},
  offTime: {name: 'OffTime', editable: true},
  onTime: {name: 'OnTime', editable: true},
  operationFlags: {name: 'OperationFlags', editable: true},
  rampRate: {name: 'RampRate', editable: true},
  serialNumber: {name: 'SerialNumber', editable: true},
  subCat: {name: 'SubCat', editable: true},
  timerEnabled: {name: 'TimerEnabled', editable: true}
};

var roomProperties = {
};
var sceneProperties = {
};
var cameraProperties = {
};
var alertProperties = {
};

InsteonAPI.prototype.house = function (id, next) {
  return this.resource(Resource, 'house', houseProperties, id, next);
};

InsteonAPI.prototype.device = function(id, next) {
  return this.resource(Resource, 'device', deviceProperties, id, next);
};

InsteonAPI.prototype.room = function(id, next) {
  return this.resource(Resource, 'room', roomProperties, id, next);
};

InsteonAPI.prototype.scene = function(id, next) {
  return this.resource(Resource, 'scene', sceneProperties, id, next);
};

InsteonAPI.prototype.camera = function(id, next) {
  return this.resource(Resource, 'camera', cameraProperties, id, next);
};

InsteonAPI.prototype.alert = function(id, next) {
  return this.resource(Resource, 'alert', alertProperties, id, next);
};

InsteonAPI.prototype.__lookupDevice = function(DeviceClass, id) {
  var device = this.__devices[id+''];
  if(device && device instanceof DeviceClass) {
    return device;
  }
  device = new DeviceClass(id, this);
  this.__devices[id] = device;
  return device;
};

InsteonAPI.prototype.light = function(id) {
  return this.__lookupDevice(Light, id);
};

InsteonAPI.prototype.command = function(command, next) {
  var api = this;
  var deferred = Q.defer();
  deferred.resolve(this.post('/commands', command)
  .then(function (rsp) {
    return api.commandStatus(rsp.id);
  }));

  return deferred.promise.nodeify(next);
};

InsteonAPI.prototype.commandStatus = function(commandId, next) {
  var deferred = Q.defer();
  var tries = this.commandTries;
  var wait = this.commandWait;
  var api = this;

  function checkStatus () {
    api.get('/commands/' + commandId)
    .then(function(rsp) {
      if(rsp.status === 'failed') {
        return deferred.reject(new Error('command (' + commandId + ') failed'));
      } else if (rsp.status === 'succeeded') {
        return deferred.resolve(rsp.response);
      }
      if(tries--) {
        setTimeout(function() {
          checkStatus();
        }, wait);
      } else {
        return deferred.reject(
          new Error('command (' + commandId + ') timeout')
        );
      }
    });
  }

  checkStatus();

  return deferred.promise.nodeify(next);

};

module.exports = InsteonAPI;