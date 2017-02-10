'use strict';
var util = require('util');
var extend = util._extend;
var events = require('events');
var request = require('request');
var Q = require('q');

var debug = require('debug')('insteon-api');

var Resource = require('./Resource');
var Scene = require('./Scene');
var Light = require('./Light');
var Door = require('./Door');
var IO = require('./IO');
var Leak = require('./Leak');
var Smoke = require('./Smoke');
var Meter = require('./Meter');
var Motion = require('./Motion');
var Thermostat = require('./Thermostat');
var Remote = require('./Remote');
var Lock = require('./Lock');

function InsteonAPI(options) {
  debug('creating api with options', options);

  this.baseUrl = 'https://connect.insteon.com/api/v2';
  this.commandTries = 5;
  this.commandWait = 2000; //ms
  this.reconnect = 3000; //ms

  extend(this, options);

  if(!this.key) {
    throw new Error('key is required.');
  }

  this.request = request.defaults({
    baseUrl: this.baseUrl,
    json: true
  });

  this.__devices = {};
  this.__scenes = {};
}

util.inherits(InsteonAPI, events.EventEmitter);

InsteonAPI.prototype.auth = function(options) {
  debug('authorizing');
  options = options || {};

  var data = {client_id: this.key};

  if(options.username && options.password) {
    data.username = options.username;
    data.password = options.password;
    data.grant_type = 'password';
  } else if(options.refreshToken) {
    data.refresh_token = options.refreshToken;
    data.grant_type = 'refresh_token';
  } else if(options.code && options.redirectURI) {
    data.code = options.code;
    data.redirect_uri = options.redirectURI;
    data.client_secret = this.secret;
    data.grant_type = 'authorization_code';
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
    api.expires = body.expires_in * 60 * 1000 + Date.now();


    api.request = api.request.defaults({
      headers: {
        'Authorization': 'Bearer ' + api.accessToken,
        'Authentication': 'APIKey ' + api.key
      }
    });

    var emitError = function (err) {
      api.emit('error', err);
    };

    if(api.monitoring) {
      for (var id in api.monitoring) {
        if (api.monitoring.hasOwnProperty(id)) {
          api.monitor(api.monitoring[id].house).catch(emitError);
        }
      }
    }

    debug('authorized');
    api.emit('auth');

  });
};


InsteonAPI.prototype.connect = function(options) {
  debug('connecting');
  options = options || {};


  var api = this;
  var connect = function(){
    api.monitor(options.house).then(function () {
      debug('connected');
      api.emit('connect');
    });
  };

  if(this.accessToken) {
    connect();
  } else {
    api.once('auth', connect);
    api.auth(options);
  }
};

InsteonAPI.prototype.monitor = function(house, next) {
  var deferred = Q.defer();
  var nodeify = deferred.promise.nodeify(next);
  var api = this;

  if(house === undefined) {
    debug('lookup houses to monitor');
    this.house().then(function (houses) {
      if(houses.length === 0) {
        return deferred.resolve();
      }
      var promises = [];
      houses.forEach(function (h) {
        promises.push(api.monitor(h));
      });
      Q.all(promises).then(deferred.resolve);
    });
    return nodeify;
  }

  if(!house) {
    debug('no house to monitor');
    deferred.resolve();
    return nodeify;
  }

  if(typeof house === 'number') {
    debug('lookup house to monitor');
    deferred.resolve(
      this.house(house)
      .then(function (h) {
        return api.monitor(h);
      })
    );
    return nodeify;
  }

  if(!house.id && typeof house.id !== 'number') {
    debug('invalid house');
    deferred.reject(new Error('Invalid house id: ' + house.id));
  }
  debug('monitoring house: ', house.id);

  this.monitoring = this.monitoring || {};

  var id = house.id + '';
  if(!this.monitoring[id]) {
    this.monitoring[id] =  {house: house};
  } else if (this.monitoring[id].stream) {
    this.monitoring[id].stream.close();
  }

  var EventSource = require('eventsource');

  var stream = new EventSource(this.baseUrl + '/houses/' + id + '/stream',
    {
      headers: {
        'Authorization': 'Bearer ' + api.accessToken,
        'Authentication': 'APIKey ' + api.key
      }

    });
  stream.onmessage = function(event) {
    debug('data for stream for house ', id, event.data);
    api.dataHandler(JSON.parse(event.data));
  };
  stream.onerror = function(err) {
    debug('error with stream for house', id, err, stream.readyState);
    setTimeout(function () {
      if (stream.readyState === EventSource.CLOSED) {
        api.emit('closed', err);
      }
    }, 100);

  };

  this.monitoring[id].stream = stream;


  deferred.resolve(this.monitoring[id]);

  return nodeify;
};

InsteonAPI.prototype.close = function () {
  if(!this.monitoring) {
    return;
  }
  for (var id in this.monitoring) {
    if (this.monitoring.hasOwnProperty(id)) {
      debug('closing stream for house ', id);
      try {
        this.monitoring[id].stream.close();
      } catch (err) {
        this.emit('error', err);
      }
    }
  }
};

InsteonAPI.prototype.dataHandler = function(data, next) {
  var deferred = Q.defer();

  var api = this;
  this.emit('command', data);
  this.lookupAddress(data.device_insteon_id)
  .then(function(device) {

    debug('handling data for device', device);
    if(device && device.id) {
      device = api.__devices[device.id+''];
    }

    debug('devices', api.__devices);
    if(device) {
      return deferred.resolve(device.dataHandler(data, next));
    }
    deferred.reject(new Error('no device found'));
  });
  return deferred.promise.nodeify(next);
};

InsteonAPI.prototype.lookupAddress = function(address, next) {
  debug('looking up device for address', address);
  var deferred = Q.defer();
  this.addresses = this.addresses || {};
  var api = this;

  if(!this.addresses[address]) {
    deferred.resolve(
      this.device()
      .then(function (devices) {
        debug('building address list with devices:', devices);
        devices.forEach(function (device) {
          api.addresses[device.insteonID] = device;
        });
        debug('addresses:', api.addresses);
        return api.addresses[address];
      })
    );
  } else {
    deferred.resolve(api.addresses[address]);
  }
  return deferred.promise.nodeify(next);
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
  debug('request.get: url = %s', url);
  this.request.get(url, requestHandler(deferred, transform));
  return deferred.promise.nodeify(next);
};

InsteonAPI.prototype.put = function(url, data, next) {
  var deferred = Q.defer();
  debug('request.put: url = %s, data = %j', url, data);
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
  debug('request.del: url = %s', url);
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
  id: {name: 'HouseID', editable: false, required: true},
  name: {name: 'HouseName', editable: true, required: true},
  insteonAddress: {name: 'InsteonHubID', editable: true, required: false},
  binVer: {name: 'BinVer', editable: false, required: false},
  plmVer: {name: 'PLMVer', editable: false, required: false},
  firmwareVer: {name: 'FirmwareVer', editable: false, required: false},
  ip: {name: 'IP', editable: false, required: false},
  port: {name: 'Port', editable: false, required: false},
  gateway: {name: 'Gateway', editable: false, required: false},
  mask: {name: 'Mask', editable: false, required: false},
  mac: {name: 'Mac', editable: false, required: false},
  location: {name: 'City', editable: true, required: false},
  dhcp: {name: 'DHCP', editable: true, required: false},
  daylightSavings: {name: 'DaylightSavings', editable: true, required: false},
  hubUsername: {name: 'HubUsername', editable: false, required: false},
  hubPassword: {name: 'HubPassword', editable: false, required: false},
  hubType: {name: 'HubType', editable: false, required: false}
};

var deviceProperties = {
  houseID: {name: 'HouseID', editable: true, required: true},
  id: {name: 'DeviceID', editable: true, required: true},
  name: {name: 'DeviceName', editable: true, required: true},
  iconID: {name: 'IconID', editable: true, required: false},
  alertOff: {name: 'AlertOff', editable: true, required: false},
  alertOn: {name: 'AlertOn', editable: true, required: false},
  alertsEnabled: {name: 'AlertsEnabled', editable: true, required: false},
  autoStatus: {name: 'AutoStatus', editable: true, required: false},
  beepOnPress: {name: 'BeepOnPress', editable: true, required: false},
  blinkOnTraffic: {name: 'BlinkOnTraffic', editable: true, required: false},
  configuredGroups: {name: 'ConfiguredGroups', editable: true, required: false},
  customOff: {name: 'CustomOff', editable: true, required: false},
  customOn: {name: 'CustomOn', editable: true, required: false},
  dayMask: {name: 'DayMask', editable: true, required: false},
  devCat: {name: 'DevCat', editable: true, required: false},
  deviceType: {name: 'DeviceType', editable: true, required: false},
  dimLevel: {name: 'DimLevel', editable: true, required: false},
  enableCustomOff: {name: 'EnableCustomOff', editable: true, required: false},
  enableCustomOn: {name: 'EnableCustomOn', editable: true, required: false},
  favorite: {name: 'Favorite', editable: true, required: false},
  firmwareVersion: {name: 'FirmwareVersion', editable: true, required: true},
  group: {name: 'Group', editable: true, required: true},
  humidity: {name: 'Humidity', editable: true, required: false},
  insteonEngine: {name: 'InsteonEngine', editable: true, required: false},
  insteonID: {name: 'InsteonID', editable: true, required: false},
  ledLevel: {name: 'LEDLevel', editable: true, required: false},
  linkWithHub: {name: 'LinkWithHub', editable: true, required: false},
  localProgramLock: {name: 'LocalProgramLock', editable: true, required: false},
  offTime: {name: 'OffTime', editable: true, required: true},
  onTime: {name: 'OnTime', editable: true, required: true},
  operationFlags: {name: 'OperationFlags', editable: true, required: false},
  rampRate: {name: 'RampRate', editable: true, required: false},
  serialNumber: {name: 'SerialNumber', editable: true, required: false},
  subCat: {name: 'SubCat', editable: true, required: false},
  timerEnabled: {name: 'TimerEnabled', editable: true, required: true}
};

var roomProperties = {
};
var sceneProperties = {
  id: {name: 'SceneID', editable: false, required: true},
  houseID: {name: 'HouseID', editable: false, required: true},
  name: {name: 'SceneName', editable: false, required: true},
  statusDevice: {name: 'StatusDevice', editable: false, required: false},
  onTime: {name: 'OnTime', editable: false, required: false},
  offTime: {name: 'OffTime', editable: false, required: false},
  customOn: {name: 'CustomOn', editable: false, required: false},
  customOff: {name: 'CustomOff', editable: false, required: false},
  group: {name: 'Group', editable: false, required: false},
  iconID: {name: 'IconID', editable: false, required: false},
  visible: {name: 'Visible', editable: false, required: false},
  favorite: {name: 'Favorite', editable: false, required: false},
  autoStatus: {name: 'AutoStatus', editable: false, required: false},
  dayMask: {name: 'DayMask', editable: false, required: false},
  timerEnabled: {name: 'TimerEnabled', editable: false, required: false},
  enableCustomOn: {name: 'EnableCustomOn', editable: false, required: false},
  enableCustomOff: {name: 'EnableCustomOff', editable: false, required: false},
  devices: {
    name: 'DeviceList',
    editable: false,
    required: false,
    elements: {
      id: {name: 'DeviceID'},
      onLevel: {name: 'OnLevel'},
      role: {name: 'DeviceRoleMask'},
      groupDetailID: {name: 'DeviceGroupDetailID'},
      rampRate: {name: 'RampRate'}
    }
  }
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
  this.__devices = this.__devices || {};
  var device = this.__devices[id+''];
  if(device && device instanceof DeviceClass) {
    return device;
  }
  device = new DeviceClass(id, this);
  this.__devices[id+''] = device;
  return device;
};

InsteonAPI.prototype.sceneDevice = function(id) {
  this.__scenes = this.__scenes || {};
  var scene = this.__scenes[id+''];
  if(scene && scene instanceof Scene) {
    return scene;
  }
  scene = new Scene(id, this);
  this.__scenes[id+''] = scene;
  return scene;
};

InsteonAPI.prototype.light = function(id) {
  return this.__lookupDevice(Light, id);
};

InsteonAPI.prototype.door = function(id) {
  return this.__lookupDevice(Door, id);
};

InsteonAPI.prototype.io = function(id) {
  return this.__lookupDevice(IO, id);
};

InsteonAPI.prototype.leak = function(id) {
  return this.__lookupDevice(Leak, id);
};

InsteonAPI.prototype.smoke = function(id) {
  return this.__lookupDevice(Smoke, id);
};

InsteonAPI.prototype.meter = function(id) {
  return this.__lookupDevice(Meter, id);
};

InsteonAPI.prototype.motion = function(id) {
  return this.__lookupDevice(Motion, id);
};

InsteonAPI.prototype.thermostat = function(id) {
  return this.__lookupDevice(Thermostat, id);
};

InsteonAPI.prototype.remote = function(id) {
  return this.__lookupDevice(Remote, id);
};

InsteonAPI.prototype.lock = function(id) {
  return this.__lookupDevice(Lock, id);
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