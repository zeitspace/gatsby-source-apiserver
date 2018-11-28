require('babel-polyfill')

const crypto = require(`crypto`)
const stringify = require(`json-stringify-safe`)
const fetch = require(`./fetch`)
const normalize = require(`./normalize`)
const objectRef = require(`./helpers`).objectRef

// const typePrefix = `thirdParty__`

exports.sourceNodes = async ({
  boundActionCreators,
  createNodeId,
  reporter
}, {
  typePrefix,
  url,
  method,
  headers,
  data,
  idField = `id`,
  localSave = false,
  skipCreateNode = false,
  path,
  auth = {},
  auth0Config = {},
  payloadKey,
  name,
  entityLevel,
  schemaType,
  params = {},
  verboseOutput = false
}) => {
  const { createNode } = boundActionCreators;

  // If true, output some info as the plugin runs
  let verbose = verboseOutput

  // Create an entity type from prefix and name supplied by user
  let entityType = `${typePrefix}${name}`
  // console.log(`entityType: ${entityType}`);

  // Fetch the data
  let entities = await fetch({url, method, headers, data, name, localSave, path, payloadKey, auth, auth0Config, params, verbose, reporter})

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

  // We're done, return.
  return
};
