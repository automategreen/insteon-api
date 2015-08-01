'use strict';
var util = require('util');
var events = require('events');
var request = require('request');
var Q = require('q');

var Resource = require('./Resource');

function InsteonAPI(options) {
  options = options || {};

  if(!options.key) {
    throw new Error('key is required.');
  }

  this.key = options.key;

  this.baseUrl = options.baseUrl || 'https://connect.insteon.com/api/v2';

  this.request = request.defaults({
    baseUrl: this.baseUrl,
    json: true
  });
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


InsteonAPI.prototype.get = function (url, transform, next) {
  var deferred = Q.defer();
  this.request.get(url, function (err, rsp, body) {
    if(err) {
      deferred.reject(err);
      return;
    }
    if((rsp || {}).statusCode !== 200) {
      deferred.reject(body);
      return;
    }
    if(transform) {
      body = transform(body);
    }
    deferred.resolve(body);
  });

  return deferred.promise.nodeify(next);

};

InsteonAPI.prototype.resource = function(resource, properties, id, next) {

  if(typeof id === 'function') {
    next = id;
    id = null;
  }

  id = id ? ('/' + id) : '';

  var resourceList =
    resource.charAt(0).toUpperCase() +
    resource.slice(1) +
    'List';

  var transform = function (body) {
    if((body || {})[resourceList]) {
      return body[resourceList].map(function (data) {
        return new Resource(properties, data);
      });
    }
    return new Resource(properties, body);
  };

  return this.get('/' + resource + 's' + id, transform, next);
};


InsteonAPI.prototype.house = function (id, next) {
  var houseProperties = {
    id: 'HouseID',
    name: 'HouseName',
    insteonAddress: 'InsteonHubID',
    binVer: 'BinVer',
    plmVer: 'PLMVer',
    firmwareVer: 'FirmwareVer',
    ip: 'IP',
    port: 'Port',
    gateway: 'Gateway',
    mask: 'Mask',
    mac: 'Mac',
    location: 'City',
    dhcp: 'DHCP',
    daylightSavings: 'DaylightSavings',
    hubUsername: 'HubUsername',
    hubPassword: 'HubPassword',
    hubType: 'HubType'
  };

  return this.resource('house', houseProperties, id, next);
};

InsteonAPI.prototype.device = function(id, next) {
  return this.resource('device', id, next);
};

InsteonAPI.prototype.room = function(id, next) {
  return this.resource('room', id, next);
};

InsteonAPI.prototype.scene = function(id, next) {
  return this.resource('scene', id, next);
};

InsteonAPI.prototype.camera = function(id, next) {
  return this.resource('camera', id, next);
};

InsteonAPI.prototype.alert = function(id, next) {
  return this.resource('alert', id, next);
};


// resource.delete .save .update
// room.delete .save .update

// api.device(123).delete()
// api.device(123).save()
// api.device(123).update({name: 'testing'});
// api.device(123).turnOff();
// api.light(123).on('turnOn')
// api.light(123).turnOn();
// api.light(123).delete();
// api.light(123).save();
// api.light('AABBCC');



module.exports = InsteonAPI;