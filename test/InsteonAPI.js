'use strict';

var InsteonAPI = require('../');
require('should');
var sinon = require('sinon');
var request = require('request');

var API_KEY = 'apikeyvalue';
var ACCESS_TOKEN  = 'accesstokenvalue';
var REFRESH_TOKEN = 'refreshtokenvalue';

describe('new InsteonAPI object', function(){

  it('has api key', function(done){
    var api = new InsteonAPI({key: API_KEY});
    api.should.have.property('key', API_KEY);
    done();
  });

  it('throws if no options.key', function(done){
    (function(){
      new InsteonAPI();
    }).should.throw();
    done();
  });

  it('has baseUrl', function(done){
    var api = new InsteonAPI({key: API_KEY});
    api.should.have.property('baseUrl', 'https://connect.insteon.com/api/v2');
    done();
  });

  it('has options.baseUrl', function(done){
    var api = new InsteonAPI({key: API_KEY, baseUrl: 'http://example.org'});
    api.should.have.property('baseUrl', 'http://example.org');
    done();
  });
});

describe('InsteonAPI connect', function(){

  before(function(done){
    sinon
      .stub(request, 'post')
      .onCall(0).yields(null, {statusCode: 200},
      {
        'access_token':ACCESS_TOKEN,
        'refresh_token':REFRESH_TOKEN,
        'token_type':'Bearer',
        'expires_in':7200
      })
      .onCall(1).yields(null, {statusCode: 401},
      {
        message: 'Invalid credentials',
        code: 4031
      })
      .onCall(2).yields(null, {statusCode: 200},
      {
        'access_token':ACCESS_TOKEN,
        'refresh_token':REFRESH_TOKEN,
        'token_type':'Bearer',
        'expires_in':7200
      })
      .onCall(3).yields(null, {statusCode: 401},
      {
        message: 'No AuthKeys found',
        code: 4032
      });
    done();
  });


  after(function(done){
    request.post.restore();
    done();
  });


  it('auth with username and password', function (done) {
    var api = new InsteonAPI({key: API_KEY});

    api.on('connect', function () {
      api.should.have.property('accessToken', ACCESS_TOKEN);
      api.should.have.property('refreshToken', REFRESH_TOKEN);
      done();
    });

    api.connect({username: 'username', password: 'password'});
  });

  it('error with invalid username and password', function (done) {
    var api = new InsteonAPI({key: API_KEY});

    api.on('error', function (err) {
      err.should.have.property('message', 'Invalid credentials');
      done();
    });

    api.connect({username: 'username', password: 'wrong'});
  });

  it('auth with refreshToken', function (done) {
    var api = new InsteonAPI({key: API_KEY});

    api.on('connect', function () {
      api.should.have.property('accessToken', ACCESS_TOKEN);
      api.should.have.property('refreshToken', REFRESH_TOKEN);
      done();
    });

    api.connect({refreshToken: 'refreshtokenvalue2'});
  });

  it('error with invalid refreshToken', function (done) {
    var api = new InsteonAPI({key: API_KEY});

    api.on('error', function (err) {
      err.should.have.property('message', 'No AuthKeys found');
      done();
    });

    api.connect({refreshToken: 'wrong'});
  });
});
