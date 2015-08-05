'use strict';

var InsteonAPI = require('../');
require('should');
var sinon = require('sinon');

var API_KEY = 'apikeyvalue';
var ACCESS_TOKEN  = 'accesstokenvalue';
var REFRESH_TOKEN = 'refreshtokenvalue';

describe('InsteonAPI light', function(){
  var api;

  before(function(done){
    api = new InsteonAPI({key: API_KEY});
    api.accessToken = ACCESS_TOKEN;
    api.refreshToken = REFRESH_TOKEN;
    api.request = api.request.defaults({
      headers: {
        'Authorization': 'Bearer ' + api.accessToken,
        'Authentication': 'APIKey ' + api.key
      }
    });

    var get = sinon.stub(api.request, 'get');
    get.onCall(0).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':50},
      'command':{'command':'on','level':50,'device_id':597465}
    });
    get.onCall(1).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':100},
      'command':{'command':'on','level':100,'device_id':597465}
    });
    get.onCall(2).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':0},
      'command':{'command':'off','device_id':597465}
    });
    get.onCall(3).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':0},
      'command':{'command':'fast_off','device_id':597465}
    });
    get.onCall(4).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':100},
      'command':{'command':'fast_on','device_id':597465}
    });
    get.onCall(5).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':6},
      'command':{'command':'get_status','device_id':597465}
    });
    get.onCall(6).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':66},
      'command':{'command':'instant_on','level':67,'device_id':597465}
    });

    sinon
      .stub(api.request, 'post')
      .yields(null, {statusCode: 202}, {
        'status':'pending','link':'/api/v2/commands/846822','id':846822
      });

    done();
  });

  after(function(done){
    api.request.get.restore();
    done();
  });

  it('turn on (50%)', function (done) {
    api.light(12345).turnOn(50)
    .then(function(rsp) {
      rsp.should.have.property('level', 50);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('turn on (default 100%)', function (done) {
    api.light(12345).turnOn()
    .then(function(rsp) {
      rsp.should.have.property('level', 100);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('turn off', function (done) {
    api.light(12345).turnOff()
    .then(function(rsp) {
      rsp.should.have.property('level', 0);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('turn off fast', function (done) {
    api.light(12345).turnOffFast()
    .then(function(rsp) {
      rsp.should.have.property('level', 0);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('turn on fast', function (done) {
    api.light(12345).turnOnFast()
    .then(function(rsp) {
      rsp.should.have.property('level', 100);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('get level', function (done) {
    api.light(12345).level()
    .then(function(rsp) {
      rsp.should.be.eql(6);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('set level', function (done) {
    api.light(12345).level(67)
    .then(function(rsp) {
      rsp.should.have.property('level', 66);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

});