'use strict';

var InsteonAPI = require('../');
require('should');
var sinon = require('sinon');

var API_KEY = 'apikeyvalue';
var ACCESS_TOKEN  = 'accesstokenvalue';
var REFRESH_TOKEN = 'refreshtokenvalue';

describe('InsteonAPI device', function(){
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
    get.onCall(0).yields(null, {statusCode: 200},
        {'DeviceList':[{
          'deviceID':12345,'DeviceID':67890,'DeviceName':'Test',
          'IconID':46,'AlertOff':0,'AlertOn':0,'AlertsEnabled':false,
          'AutoStatus':false,'BeepOnPress':true,'BlinkOnTraffic':false,
          'ConfiguredGroups':1,'CustomOff':'','CustomOn':'','DayMask':0,
          'DevCat':1,'DeviceType':0,'DimLevel':254,'EnableCustomOff':false,
          'EnableCustomOn':false,'Favorite':true,'FirmwareVersion':65,
          'Group':1,'Humidity':false,'InsteonEngine':2,'InsteonID':'AABBCC',
          'LEDLevel':32,'LinkWithHub':0,'LocalProgramLock':false,'OffTime':'',
          'OnTime':'','OperationFlags':0,'RampRate':28,'SerialNumber':'AABBCC',
          'SubCat':14,'TimerEnabled':false}]});
    get.yields(null, {statusCode: 200},
        {
          'deviceID':12345,'DeviceID':67890,'DeviceName':'Test',
          'IconID':46,'AlertOff':0,'AlertOn':0,'AlertsEnabled':false,
          'AutoStatus':false,'BeepOnPress':true,'BlinkOnTraffic':false,
          'ConfiguredGroups':1,'CustomOff':'','CustomOn':'','DayMask':0,
          'DevCat':1,'DeviceType':0,'DimLevel':254,'EnableCustomOff':false,
          'EnableCustomOn':false,'Favorite':true,'FirmwareVersion':65,
          'Group':1,'Humidity':false,'InsteonEngine':2,'InsteonID':'AABBCC',
          'LEDLevel':32,'LinkWithHub':0,'LocalProgramLock':false,'OffTime':'',
          'OnTime':'','OperationFlags':0,'RampRate':28,'SerialNumber':'AABBCC',
          'SubCat':14,'TimerEnabled':false});

    sinon
      .stub(api.request, 'post')
      .yields(null, {statusCode: 201}, { 'DeviceID': 67890 });

    sinon
      .stub(api.request, 'put')
      .yields(null, {statusCode: 204});

    sinon
      .stub(api.request, 'del')
      .yields(null, {statusCode: 204});

    done();
  });


  after(function(done){
    api.request.get.restore();
    done();
  });

  it('returns device list', function (done) {
    api.device()
    .then(function(deviceList) {
      deviceList.length.should.equal(1);
      deviceList[0].should.have.property('id', 67890);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('returns device details', function (done) {
    api.device(67890)
    .then(function(device) {
      device.should.have.property('id', 67890);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('update device details', function (done) {
    api.device(67890)
    .then(function(device) {
      device.should.have.property('id', 67890);
      device.name = 'Automate Green';
      return device.save();
    })
    .then(function (device) {
      device.should.have.property('name', 'Automate Green');
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('delete device device', function (done) {
    api.device(67890)
    .then(function(device) {
      device.should.have.property('id', 67890);
      return device.del();
    })
    .then(done)
    .catch(function (err) {
      done(err);
    });
  });

  it('create device', function (done) {
    api.device({
      houseID: 12345,
      name: 'New Device',
      insteonID: 'AABBCC',
      firmwareVersion: 65,
      onTime: '',
      offTime: '',
      timerEnabled: false,
      group: 1
    })
    .then(function(device) {
      device.should.have.property('id', 67890);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

});
