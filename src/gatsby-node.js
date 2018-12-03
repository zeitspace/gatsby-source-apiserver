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
    const typePrefix = entity.typePrefix ? entity.typePrefix : typePrefix
    const url = entity.url ? entity.url : url
    const method = entity.method ? entity.method : method
    const headers = entity.headers ? entity.headers : headers
    const data = entity.data ? entity.data : data
    const localSave = entity.localSave ? entity.localSave : localSave
    const skipCreateNode = entity.skipCreateNode ? entity.skipCreateNode : skipCreateNode
    const path = entity.path ? entity.path : path
    const auth = entity.auth ? entity.auth : auth
    const params = entity.params ? entity.params : params
    const payloadKey = entity.payloadKey ? entity.payloadKey : payloadKey
    const name = entity.name ? entity.name : name
    const entityLevel = entity.entityLevel ? entity.entityLevel : entityLevel 
    const schemaType = entity.schemaType ? entity.schemaType : schemaType

    if (authorization) headers.Authorization = authorization
    // Create an entity type from prefix and name supplied by user
    let entityType = `${typePrefix}${name}`
    // console.log(`entityType: ${entityType}`);

    // Fetch the data
    let entities = await fetch({url, method, headers, data, name, localSave, path, payloadKey, auth, params, verbose, reporter})

    // Interpolate entities from nested resposne
    if (entityLevel) {
      entities = objectRef(entities, entityLevel)
    }

    // If entities is a single object, add to array to prevent issues with creating nodes
    if(entities && !Array.isArray(entities)) {
      entities = [entities]
    }

    // console.log(`save: `, localSave);
    // console.log(`entities: `, entities.data);

    // Skip node creation if the goal is to only download the data to json files
    if(skipCreateNode) {
      return
    }

    // Generate the nodes
    normalize.createNodesFromEntities({
        entities,
        entityType,
        schemaType,
        createNode,
        createNodeId,
        reporter})

    })

  // We're done, return.
  return
};
