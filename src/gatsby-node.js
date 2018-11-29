require('babel-polyfill')

const axios = require('axios')
const fetch = require(`./fetch`)
const normalize = require(`./normalize`)
const objectRef = require(`./helpers`).objectRef
const forEachAsync = require('./helpers').forEachAsync

// const typePrefix = `thirdParty__`

exports.sourceNodes = async ({
  boundActionCreators,
  createNodeId,
  reporter
}, {
  typePrefix,
  url,
  method,
  headers = {},
  data,
  localSave = false,
  skipCreateNode = false,
  path,
  auth = {},
  auth0Config = {},
  payloadKey,
  name,
  entityLevel,
  schemaType,
  entitiesArray = [{}],
  params = {},
  verboseOutput = false
}) => {
  const { createNode } = boundActionCreators;

  // If true, output some info as the plugin runs
  let verbose = verboseOutput

  let authorization
  if(auth0Config) {
    console.time('\nAuthenticate user');
    // Make API request.
    try {
      const loginResponse = await axios(auth0Config);

      if (loginResponse.hasOwnProperty('data')) {
        authorization = 'Bearer ' + loginResponse.data.id_token;
      }
    } catch (error) {
      console.error('\nEncountered authentication error: ' + error);
    }
    console.timeEnd('\nAuthenticate user');
  }

  await forEachAsync(entitiesArray, async (entity) => {

    // default to the general properties for any props not provided
    const _typePrefix = entity.typePrefix ? entity.typePrefix : typePrefix
    const _url = entity.url ? entity.url : url
    const _method = entity.method ? entity.method : method
    const _headers = entity.headers ? entity.headers : headers
    const _data = entity.data ? entity.data : data
    const _localSave = entity.localSave ? entity.localSave : localSave
    const _skipCreateNode = entity.skipCreateNode ? entity.skipCreateNode : skipCreateNode
    const _path = entity.path ? entity.path : path
    const _auth = entity.auth ? entity.auth : auth
    const _params = entity.params ? entity.params : params
    const _payloadKey = entity.payloadKey ? entity.payloadKey : payloadKey
    const _name = entity.name ? entity.name : name
    const _entityLevel = entity.entityLevel ? entity.entityLevel : entityLevel 
    const _schemaType = entity.schemaType ? entity.schemaType : schemaType

    if (authorization) _headers.Authorization = authorization
    // Create an entity type from prefix and name supplied by user
    let entityType = `${_typePrefix}${_name}`
    // console.log(`entityType: ${entityType}`);

    // Fetch the data
    let entities = await fetch({_url, _method, _headers, _data, _name, _localSave, _path, _payloadKey, _auth, _params, verbose, reporter})

    // Interpolate entities from nested resposne
    if (_entityLevel) {
      entities = objectRef(entities, _entityLevel)
    }

    // If entities is a single object, add to array to prevent issues with creating nodes
    if(entities && !Array.isArray(entities)) {
      entities = [entities]
    }

    // console.log(`save: `, localSave);
    // console.log(`entities: `, entities.data);

    // Skip node creation if the goal is to only download the data to json files
    if(_skipCreateNode) {
      return
    }

    // Generate the nodes
    normalize.createNodesFromEntities({
        entities,
        entityType,
        _schemaType,
        createNode,
        createNodeId,
        reporter})

    })

  // We're done, return.
  return
};
