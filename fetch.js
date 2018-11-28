let fetch = (() => {
  var _ref = _asyncToGenerator(function* ({
    _url,
    _method,
    _headers,
    _data,
    _name,
    _localSave,
    _path,
    _payloadKey,
    _auth,
    _params,
    verbose,
    reporter
  }) {

    let allRoutes;

    // Attempt to download the data from api
    try {
      let options = {
        method: _method,
        url: _url,
        headers: _headers,
        data: _data,
        params: _params
      };
      if (_auth) {
        options.auth = _auth;
      }
      allRoutes = yield axios(options);
    } catch (e) {
      console.log('\nGatsby Source Api Server response error:\n', e.response.data && e.response.data.errors);
      httpExceptionHandler(e, reporter);
    }

    if (allRoutes) {
      // console.log(`allRoutes: `, allRoutes.data);

      // Create a local save of the json data in the user selected path
      if (_localSave) {
        try {
          fs.writeFileSync(`${_path}${_name}.json`, stringify(allRoutes.data, null, 2));
        } catch (err) {
          reporter.panic(`Plugin ApiServer could not save the file.  Please make sure the folder structure is already in place.`, err);
        }

        if (verbose) {
          log(chalk`{bgCyan Plugin ApiServer} ${_name}.json was saved locally to ${_path}`);
        }
      }

      // Return just the intended data
      if (_payloadKey) {
        return allRoutes.data[_payloadKey];
      }
      return allRoutes.data;
    }
  });

  return function fetch(_x) {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const axios = require(`axios`);
const fs = require('fs');
const stringify = require(`json-stringify-safe`);
const httpExceptionHandler = require(`./http-exception-handler`);
const chalk = require('chalk');
const log = console.log;

module.exports = fetch;