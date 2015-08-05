'use strict';

var InsteonAPI = require('../');
require('should');
var sinon = require('sinon');

var API_KEY = 'apikeyvalue';
var ACCESS_TOKEN  = 'accesstokenvalue';
var REFRESH_TOKEN = 'refreshtokenvalue';

describe('InsteonAPI house', function(){
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
        {'HouseList':[{
          'HouseID':12345,'HouseName':'MyHouse','IconID':0,
          'InsteonHubID':'AABBCC','BinVer':'Hub2-V03-20140617',
          'PLMVer':'9D','FirmwareVer':'1002',
          'IP':'10.0.0.10','Port':'25105','Gateway':'10.0.0.1',
          'Mask':'255.255.255.0','Mac':'000EF3AABBCC','City':'Canton',
          'DHCP':'True','DaylightSavings':'True','HubUsername':'hubuser',
          'HubPassword':'hubpass','HubType':'HUB2'
        }]});
    get.yields(null, {statusCode: 200},
        {
          'HouseID':12345,'HouseName':'MyHouse','IconID':0,
          'InsteonHubID':'AABBCC','BinVer':'Hub2-V03-20140617',
          'PLMVer':'9D','FirmwareVer':'1002',
          'IP':'10.0.0.10','Port':'25105','Gateway':'10.0.0.1',
          'Mask':'255.255.255.0','Mac':'000EF3AABBCC','City':'Canton',
          'DHCP':'True','DaylightSavings':'True','HubUsername':'hubuser',
          'HubPassword':'hubpass','HubType':'HUB2'
        });

    sinon
      .stub(api.request, 'post')
      .yields(null, {statusCode: 201}, { 'HouseID': 12345 });

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

  it('returns house list', function (done) {
    api.house()
    .then(function(houseList) {
      houseList.length.should.equal(1);
      houseList[0].should.have.property('id', 12345);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('returns house details', function (done) {
    api.house(12345)
    .then(function(house) {
      house.should.have.property('id', 12345);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

  it('update house details', function (done) {
    api.house(12345)
    .then(function(house) {
      house.should.have.property('id', 12345);
      house.name = 'Automate Green';
      return house.save();
    })
    .then(done)
    .catch(function (err) {
      done(err);
    });
  });

  it('delete house house', function (done) {
    api.house(12345)
    .then(function(house) {
      house.should.have.property('id', 12345);
      return house.del();
    })
    .then(done)
    .catch(function (err) {
      done(err);
    });
  });

  it('create house', function (done) {
    api.house({
      name: 'New Home',
      insteonHubID: 'AABBCC'
    })
    .then(function(house) {
      house.should.have.property('id', 12345);
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });

});
