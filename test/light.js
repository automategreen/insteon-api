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

    var n = 0;

    var get = sinon.stub(api.request, 'get');
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':50},
      'command':{'command':'on','level':50,'device_id':597465}
    });
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':100},
      'command':{'command':'on','level':100,'device_id':597465}
    });
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':100},
      'command':{'command':'on','level':100,'device_id':597465}
    });
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':0},
      'command':{'command':'off','device_id':597465}
    });
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':0},
      'command':{'command':'fast_off','device_id':597465}
    });
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':100},
      'command':{'command':'fast_on','device_id':597465}
    });
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':6},
      'command':{'command':'get_status','device_id':597465}
    });
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':6},
      'command':{'command':'get_status','device_id':597465}
    });
    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':66},
      'command':{'command':'instant_on','level':67,'device_id':597465}
    });

    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':66},
      'command':{'command':'dim','level':67,'device_id':597465}
    });

    get.onCall(n++).yields(null, {statusCode: 200}, {
      'id':846822,
      'status':'succeeded',
      'response':{'level':66},
      'command':{'command':'brighten','level':67,'device_id':597465}
    });

    get.yields(null, {statusCode: 200},{
      'deviceID':12345,'DeviceID':67890,'DeviceName':'Test',
      'IconID':46,'AlertOff':0,'AlertOn':0,'AlertsEnabled':false,
      'AutoStatus':false,'BeepOnPress':true,'BlinkOnTraffic':false,
      'ConfiguredGroups':1,'CustomOff':'','CustomOn':'','DayMask':0,
      'DevCat':1,'DeviceType':0,'DimLevel':254,'EnableCustomOff':false,
      'EnableCustomOn':false,'Favorite':true,'FirmwareVersion':65,
      'Group':1,'Humidity':false,'InsteonEngine':2,'InsteonID':'AABBCC',
      'LEDLevel':32,'LinkWithHub':0,'LocalProgramLock':false,'OffTime':'',
      'OnTime':'','OperationFlags':0,'RampRate':28,'SerialNumber':'AABBCC',
      'SubCat':14,'TimerEnabled':false
    });

    sinon
      .stub(api.request, 'post')
      .yields(null, {statusCode: 202}, {
        'status':'pending','link':'/api/v2/commands/846822','id':846822
      });

    sinon
      .stub(api.request, 'put')
      .yields(null, {statusCode: 204});

    done();
  });

  after(function(done){
    api.request.get.restore();
    api.request.post.restore();
    api.request.put.restore();
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

  it('turn on (default 100%) (cb)', function (done) {
    api.light(12345).turnOn(done);
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

  it('get level (cb)', function (done) {
    api.light(12345).level(done);
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

  it('dim (cb)', function (done) {
    api.light(12345).dim(done);
  });

  it('brighten (cb)', function (done) {
    api.light(12345).brighten(done);
  });


  it('get on level', function (done) {
    api.light(12345).onLevel()
    .then(function(rsp) {
      rsp.should.be.eql(254/255*100);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('get on level (cb)', function (done) {
    api.light(12345).onLevel(done);
  });


  it('set on level', function (done) {
    api.light(12345).onLevel(75)
    .then(function() {
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('set on level (cb)', function (done) {
    api.light(12345).onLevel(100, done);
  });

  it('get ramp rate', function (done) {
    api.light(12345).rampRate()
    .then(function(rsp) {
      rsp.should.be.eql(500);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('get ramp rate (cb)', function (done) {
    api.light(12345).rampRate(done);
  });


  it('set ramp rate', function (done) {
    api.light(12345).rampRate(2000)
    .then(function() {
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('set ramp rate (cb)', function (done) {
    api.light(12345).rampRate(1, done);
  });



});