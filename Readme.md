insteon-api [![Build Status](https://travis-ci.org/automategreen/insteon-api.png)](https://travis-ci.org/automategreen/insteon-api)
===============
> a node package for the Insteon REST API
***

Overview
--------

**WARNING** This package is under development.

insteon-api is a node package for the Insteon REST API. The goal of this package is to mirror our existing [home-controller package](https://github.com/automategreen/home-controller). This will reduce the effort of moving your existing code to the new Hub.

**Only the new Insteon Hub (2245) is supported.**


Table of Contents
-----------------

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [API](#api)
  + [Insteon API](#insteon-api)
  + [Light Functions](#light-functions)
  + [Light Events](#light-events)
- [Testing](#testing)
- [References](#references)

Features
--------

- Device and Gateway Info
- Linking and Group Control
- Scene Control
- Lighting Control
- Thermostat Control
- Sensor Control

Getting Started
---------------

### Install

Install via npm:

`npm install insteon-api`

### Example

Here is a simple example to turn on your light.

```js
var InsteonAPI = require('insteon-api');

var api = new InsteonAPI({key: process.env.INSTEON_API_KEY});

api.on('connect', function() {
  api.light(12345).turnOn()
  .then(function(rsp) {
    console.log('Turned On: ', rsp);
  });
});

api.on('error', function(err) {
  console.log('Error: ', err);
});

api.connect({
 username: process.env.INSTEON_USERNAME,
 password: process.env.INSTEON_PASSWORD
});
```


API
---

### InsteonAPI

#### require('insteon-api')(options)

Add `require` statement to the app to access the InsteonAPI class.  You provide your API key to create an api object for your developer account.

**Options**
- `key` the Insteon API key (required)
- `secret` the Insteon API secret (required for auth code only)

**Example**

```js
var InsteonAPI = require('insteon-api');

var api = new InsteonAPI({
  key: process.env.INSTEON_API_KEY,
  secret: process.env.INSTEON_API_SECRET // Optional
});
```

The InsteonAPI class inherits [EventEmitter](http://nodejs.org/api/events.html)


#### api.connect(options) or api.auth(options)

Connects the api object to a user account.  There are three ways to authenticate: user credentials, an authorization code, or refresh token.  The authorization code and refreshing an authorization code token requires the `secret` option be set on the api object.

**User Credential Options**
- `username` the Insteon App user name
- `password` the Insteon App password

**Authorization Code Options**
- `code` the authorization code received from Insteon.

**Refresh Option**
- `refreshToken` the refresh token for a Insteon App user.

When the 'connect' event is emitted the connection is established. If there is a problem connecting, the 'connect' event will not be emitted, the 'error' event will be emitted with the exception.

#### Event: 'connect'

Emitted when user authentication is complete.

#### Event: 'command'

Emitted when an command is received. The argument `command` will be the command object.

**Callback arguments**

- `command` received from gateway

#### Event: 'error'

Emitted when an error occurs.

**Callback arguments**

- `error` the error that occurred

#### api.accessToken

The access token received from the auth request

#### api.refreshToken

The refresh token received from the auth request

### House

#### api.house(id, [callback])

#### api.house(properties, [callback])

#### house.save([callback])

#### house.del([callback])

### Device

#### api.device(id, [callback])

#### api.device(properties, [callback])

#### device.save([callback])

#### device.del([callback])

### Room

TODO

### Scene

TODO

### Camera

TODO

### Alert

TODO

### Light

#### api.light(id)

Get the light object for the device id

The `id` is the Insteon API device ID.  It is **not** the Insteon Hex ID.

#### light.turnOn(level, [callback])

Turn the device on at ramp rate to `level`

#### light.turnOn([callback])

Turn the device on at ramp rate to on level

#### light.turnOnFast([callback])

Turn the device on instantly

#### light.turnOff([callback])

Turn the device off at ramp rate

#### light.turnOffFast([callback])

Turn the device off instantly

#### light.brighten([callback])

Brighten the device by one step (approximately 4%)

#### light.dim([callback])

Dims the device by on step (approximately 4%)

#### light.level([callback])

Returns the current device level.

The `level` returned is a percentage from 0 to 100.

#### light.level(level, [callback])

Set the device level instantly

Valid `level` values are 0 to 100.

#### light.info([callback])

Returns an info object for the device.

**Info Object**
```js
{
  onLevel: 100,  // percentage 1-100
  rampRate: 500, // milliseconds
  ledBrightness: 32
}
```

#### light.rampRate([callback])

Returns the configured ramp rate for the device

The returned `rate` is in milliseconds.

#### light.rampRate(rate, [callback])

Set the ramp rate for the device

The `rate` is in milliseconds and will be rounded to the nearest supported value.

#### light.onLevel([callback])

Return the configured on level for the device

The `level` returned is a percentage from 1 to 100.

#### light.onLevel(level, [callback])

Set the on level for the device

Valid `level` values are 1 to 100.

### Light Events

#### Event: trunOn

Event emitted when the device is turned on

#### Event: trunOff

Event emitted when the device is turned off

Testing
-------

To test the package run:

	grunt test

References
----------

- [Insteon Developer](http://www.insteon.com/developer/)
- [Automate Green Blog](https://blog.automategreen.com)
