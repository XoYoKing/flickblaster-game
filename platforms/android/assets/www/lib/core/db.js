var config, debugDb;

debugDb = require('./debug').debugDB;

config = {
  ns: 'greekathlon',
  version: '',
  name: 'Greekathlon',
  size: 1024 * 1024
};

module.exports = {
  initialise: function() {
    if (!window.openDatabase) {
      this.db = {
        transaction: function(callback) {
          return callback({
            executeSql: function(query, options, callback) {
              return callback(null, null);
            }
          });
        }
      };
      return this.supported = false;
    } else {
      this.db = window.openDatabase(config.ns, config.version, config.name, config.size);
      return this.supported = true;
    }
  },
  onError: function(q, m) {
    return console.log('DB ERROR:', m);
  },
  query: function(queryStr, options, callback) {
    var _this = this;

    if (options == null) {
      options = [];
    }
    if (debugDb) {
      console.log("DB QUERY: " + queryStr);
    }
    return this.db.transaction(function(t) {
      return t.executeSql(queryStr, options, function(t, results) {
        results = results ? _this.fixResults(results) : [];
        if (typeof callback === 'function') {
          return callback(results);
        }
      }, _this.onError);
    }, this.onError);
  },
  fixResults: function(res) {
    var i, item, result, row, _i, _len, _ref;

    result = [];
    _ref = res.rows;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      item = _ref[i];
      row = res.rows.item(i);
      result.push(row);
    }
    return result;
  },
  select: function(table, conditions, options, callback) {
    var conditionStr, dir, key, queryStr, value;

    if (conditions == null) {
      conditions = {};
    }
    if (options == null) {
      options = {};
    }
    queryStr = "SELECT * FROM " + table;
    conditionStr = ((function() {
      var _results;

      _results = [];
      for (key in conditions) {
        value = conditions[key];
        _results.push("" + key + " = '" + value + "'");
      }
      return _results;
    })()).join(', ');
    if (conditionStr.length) {
      queryStr += " WHERE " + conditionStr;
    }
    if (options.order != null) {
      dir = options.order[1] > 0 ? 'ASC' : 'DESC';
      queryStr += " ORDER BY " + options.order[0] + " " + dir;
    }
    if (options.limit != null) {
      queryStr += " LIMIT " + options.limit;
    }
    return this.query(queryStr, [], callback);
  },
  insert: function(table, values, callback) {
    var key, keys, val;

    if (values == null) {
      values = {};
    }
    keys = ((function() {
      var _results;

      _results = [];
      for (key in values) {
        val = values[key];
        _results.push(key);
      }
      return _results;
    })()).join(', ');
    values = ((function() {
      var _results;

      _results = [];
      for (key in values) {
        val = values[key];
        _results.push("'" + val + "'");
      }
      return _results;
    })()).join(', ');
    return this.query("INSERT INTO " + table + "(" + keys + ") values(" + values + ")", [], callback);
  },
  "delete": function(table, conditions, callback) {
    var conditionStr, key, queryStr, value;

    if (conditions == null) {
      conditions = {};
    }
    queryStr = "DELETE FROM " + table;
    conditionStr = ((function() {
      var _results;

      _results = [];
      for (key in conditions) {
        value = conditions[key];
        _results.push("" + key + " = '" + value + "'");
      }
      return _results;
    })()).join(', ');
    if (conditionStr.length) {
      queryStr += " WHERE " + conditionStr;
    }
    return this.query(queryStr, [], callback);
  },
  createTable: function(tableName, schema, callback) {
    var fieldsStr, fieldsStrAdd, key, type;

    if (schema == null) {
      schema = {};
    }
    fieldsStr = "id INTEGER PRIMARY KEY AUTOINCREMENT";
    fieldsStrAdd = ((function() {
      var _results;

      _results = [];
      for (key in schema) {
        type = schema[key];
        _results.push("" + key + " " + type);
      }
      return _results;
    })()).join(', ');
    if (fieldsStrAdd.length) {
      fieldsStr = "" + fieldsStr + ", " + fieldsStrAdd;
    }
    return this.query("CREATE TABLE IF NOT EXISTS " + tableName + "(" + fieldsStr + ")", [], callback);
  },
  dropTable: function(tableName, callback) {
    return this.query("DROP TABLE " + tableName, [], callback);
  }
};
