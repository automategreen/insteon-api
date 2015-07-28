'use strict';
var util = require('util');
var events = require('events');
var request = require('request');
// var Q = require('q');

function InsteonAPI(options) {
  options = options || {};

  if(!options.key) {
    throw new Error('key is required.');
  }

  this.key = options.key;

  this.baseUrl = options.baseUrl || 'https://connect.insteon.com/api/v2/';

  this.request = request.defaults({
    baseUrl: this.baseUrl
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
    json: true,
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

    api.emit('connect');
  });


};


module.exports = InsteonAPI;