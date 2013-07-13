var db, debugDb, installedSchemas, schemasReadyCallbacks;

db = require('./db');

debugDb = require('./debug').debugDB;

if (_.has(localStorage, 'installedSchemas')) {
  installedSchemas = JSON.parse(localStorage.installedSchemas || {});
} else {
  installedSchemas = {};
}

schemasReadyCallbacks = [];

module.exports = {
  schemas: {},
  loaded: 0,
  ready: false,
  load: function(ns, schema) {
    var routes, _results;

    if (typeof ns === 'object') {
      routes = ns;
      _results = [];
      for (ns in routes) {
        schema = routes[ns];
        _results.push(this.load(ns, schema));
      }
      return _results;
    } else {
      return this.schemas[ns] = schema;
    }
  },
  initialise: function() {
    var id, schema, _ref, _results;

    if (this.getSchemasCount() === 0) {
      return this.onSchemasReady();
    } else {
      _ref = this.schemas;
      _results = [];
      for (id in _ref) {
        schema = _ref[id];
        _results.push(this.initSchema(schema));
      }
      return _results;
    }
  },
  initSchema: function(schema) {
    var isInstalled, isUpdated, serialisedSchema, tableName,
      _this = this;

    this.log("Init '" + schema.tableName + "' schema...");
    tableName = schema.tableName;
    isInstalled = _.has(installedSchemas, tableName);
    if (isInstalled) {
      serialisedSchema = JSON.stringify(schema.fields);
      isUpdated = serialisedSchema === installedSchemas[tableName];
      if (!isUpdated) {
        return this.migrateSchema(schema, function() {
          return _this.onSchemaReady(schema);
        });
      } else {
        return this.onSchemaReady(schema);
      }
    } else {
      return this.installSchema(schema, function() {
        return _this.onSchemaReady(schema);
      });
    }
  },
  installSchema: function(schema, callback) {
    var _this = this;

    this.log("Install '" + schema.tableName + "' schema...");
    return db.createTable(schema.tableName, schema.fields, function() {
      installedSchemas[schema.tableName] = JSON.stringify(schema.fields);
      return _this.onSchemaReady(schema);
    });
  },
  migrateSchema: function(schema, callback) {
    var _this = this;

    return db.dropTable(schema.tableName, function() {
      return _this.installSchema(schema, callback);
    });
  },
  onSchemaReady: function(schema) {
    this.log("'" + schema.tableName + "' ready!");
    this.ready++;
    if (this.ready === this.getSchemasCount()) {
      this.ready = true;
      return this.onSchemasReady();
    }
  },
  onSchemasReady: function() {
    var callback, _i, _len, _results;

    this.log('All schemas loaded!');
    localStorage.installedSchemas = JSON.stringify(installedSchemas);
    _results = [];
    for (_i = 0, _len = schemasReadyCallbacks.length; _i < _len; _i++) {
      callback = schemasReadyCallbacks[_i];
      _results.push(callback());
    }
    return _results;
  },
  onReady: function(callback) {
    if (this.ready) {
      callback();
    }
    return schemasReadyCallbacks.push(callback);
  },
  getSchemasCount: function() {
    var count, schema;

    count = 0;
    for (schema in this.schemas) {
      count++;
    }
    return count;
  },
  log: function(m) {
    if (debugDb) {
      return console.log("DB: " + m);
    }
  }
};
