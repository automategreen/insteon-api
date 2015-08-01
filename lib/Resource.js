function Resource(properties, data) {
  for(var prop in properties) {
    this[prop] = data[properties[prop]];
  }
}

Resource.prototype.save = function() {
};

Resource.prototype.delete = function() {
};

Resource.prototype.update = function() {
};

module.exports = Resource;