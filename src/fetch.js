const axios = require(`axios`)
const fs = require('fs')
const stringify = require(`json-stringify-safe`)
const httpExceptionHandler = require(`./http-exception-handler`)
const chalk = require('chalk')
const log = console.log

async function fetch({
  url,
  method,
  headers,
  data,
  name,
  localSave,
  path,
  payloadKey,
  auth,
  auth0Config,
  params,
  verbose,
  reporter
}) {

  let allRoutes

  // Attempt to download the data from api
  try {
    if(auth0Config) {
      console.time('\nAuthenticate user');
      // Make API request.
      try {
        const loginResponse = await axios(auth0Config);

        if (loginResponse.hasOwnProperty('data')) {
          headers.Authorization = 'Bearer ' + loginResponse.data.id_token;
        }
      } catch (error) {
        console.error('\nEncountered authentication error: ' + error);
      }
      console.timeEnd('\nAuthenticate user');
    }
    let options = {
      method: method,
      url: url,
      headers: headers,
      data: data,
      params: params
    }
    if(auth) {
      options.auth = auth
    }
    allRoutes = await axios(options)
  } catch (e) {
    console.log('\nGatsby Source Api Server response error:\n', e.response.data && e.response.data.errors)
    httpExceptionHandler(e, reporter)
  }

  if(allRoutes) {
    // console.log(`allRoutes: `, allRoutes.data);

    // Create a local save of the json data in the user selected path
    if(localSave) {
      try {
        fs.writeFileSync(`${path}${name}.json`, stringify(allRoutes.data, null, 2))
      } catch(err) {
        reporter.panic(`Plugin ApiServer could not save the file.  Please make sure the folder structure is already in place.`, err)
      }

      if(verbose) {
        log(chalk`{bgCyan Plugin ApiServer} ${name}.json was saved locally to ${path}`)
      }
    }

    // Return just the intended data
    if(payloadKey) {
      return allRoutes.data[payloadKey]
    }
    return allRoutes.data
  }
}

module.exports = fetch
