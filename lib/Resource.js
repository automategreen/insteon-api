
function Resource(api, type, properties, data) {
  this._api = api;
  this._type = type;
  this._properties = properties;
  for(var prop in properties) {
    this[prop] = data[prop] || data[properties[prop].name];
  }
}

Resource.prototype.save = function(next) {
  var data = {};

  for(var key in this._properties) {
    var prop = this._properties[key];
    if(prop.editable) {
      data[prop.name] = this[key];
    }
  }

  if(this.id) {
    return this._api.put('/' + this._type + 's/' + this.id, data, next);
  }

  var resource = this;
  return this._api.post('/' + this._type + 's', data, next)
  .then(function (data) {
    for(var prop in resource._properties) {
      resource[prop] = data[resource._properties[prop].name] || resource[prop];
    }
    return resource;
  });
};

Resource.prototype.del = function(next) {
  return this._api.del('/' + this._type + 's/' + this.id, next);
};

module.exports = Resource;