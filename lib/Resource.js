
function Resource(api, type, properties, data) {
  this._api = function () { return api; };
  this._type = function () { return type; };
  this._properties = function () { return properties; };
  for(var prop in properties) {
    this[prop] = data[prop] || data[properties[prop].name];
  }
}

function putPostData(resource, data, next) {
  if(resource.id) {
    return resource._api()
    .put('/' + resource._type() + 's/' + resource.id, data, next)
    .then(function() {
      return resource;
    });
  }

  return resource._api()
  .post('/' + resource._type() + 's', data, next)
  .then(function (data) {
    for(var prop in resource._properties()) {
      resource[prop] = data[resource._properties()[prop].name] || resource[prop];
    }
    return resource;
  });
}

Resource.prototype.update = function(update, next) {
  var data = {};

  var key, prop;

  for(key in this._properties()) {
    prop = this._properties()[key];
    if(prop.required) {
      data[prop.name] = this[key];
    }
  }


  for(key in update) {
    prop = this._properties()[key];
    if(prop && prop.editable) {
      data[prop.name] = update[key];
      this[key] = update[key];
    }
  }


  return putPostData(this, data, next);

};

Resource.prototype.save = function(next) {
  var data = {};

  for(var key in this._properties()) {
    var prop = this._properties()[key];
    if(prop.editable) {
      data[prop.name] = this[key];
    }
  }

  return putPostData(this, data, next);

};

Resource.prototype.del = function(next) {
  return this._api().del('/' + this._type() + 's/' + this.id, next);
};

module.exports = Resource;