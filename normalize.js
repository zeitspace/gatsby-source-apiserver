var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const crypto = require(`crypto`);
const stringify = require(`json-stringify-safe`);
const deepMapKeys = require(`deep-map-keys`);
const nanoid = require(`nanoid`);
const chalk = require('chalk');
const log = console.log;

/**
 * Encrypts a String using md5 hash of hexadecimal digest.
 *
 * @param {any} str
 */
const digest = str => crypto.createHash(`md5`).update(str).digest(`hex`);

// Prefix to use if there is a conflict with key name
const conflictFieldPrefix = `alternative_`;

// Keys that will conflic with graphql
const restrictedNodeFields = [`id`, `children`, `parent`, `fields`, `internal`];

// Create nodes from entities
exports.createNodesFromEntities = ({ entities, entityType, schemaType, createNode, createNodeId, reporter }) => {

  // Standardize and clean keys
  entities = standardizeKeys(entities);

  // Add entity type to each entity
  entities = createEntityType(entityType, entities);

  const dummyEntity = _extends({
    id: 'dummy',
    __type: entityType
  }, schemaType);
  entities.push(dummyEntity);

  entities.forEach(e => {
    const { __type } = e,
          entity = _objectWithoutProperties(e, ['__type']);

    // if (schemaType) {
    //   const fieldNames = Object.keys(entity)
    //   fieldNames.forEach(fieldName => {
    //     entity[fieldName] = setBlankValue(schemaType[fieldName], entity[fieldName])
    //   })
    // }

    const node = _extends({}, entity, {
      id: createGatsbyId(createNodeId),
      parent: null,
      children: [],
      mediaType: 'application/json',
      internal: {
        type: __type,
        contentDigest: digest(JSON.stringify(entity))
      }
    });
    // console.log(`node: `, node);
    createNode(node);
  });
};

// If entry is not set by user, provide an empty value of the same type
const setBlankValue = (shemaValue, fieldValue) => {
  if (typeof shemaValue === 'string') {
    return typeof fieldValue === `undefined` || fieldValue === null ? '' : fieldValue;
  } else if (typeof shemaValue === 'number') {
    return typeof fieldValue === `undefined` || fieldValue === null ? NaN : fieldValue;
  } else if (typeof shemaValue === 'object' && !Array.isArray(shemaValue)) {
    const obj = typeof fieldValue === `undefined` || fieldValue === null ? {} : fieldValue;
    Object.keys(shemaValue).forEach(itemName => {
      obj[itemName] = setBlankValue(shemaValue[itemName]);
    });
    return obj;
  } else if (typeof shemaValue === 'object' && Array.isArray(shemaValue)) {
    // TODO: Need to fix it
    return [setBlankValue(shemaValue[0])];
  } else if (typeof shemaValue === 'boolean') {
    return typeof fieldValue === `undefined` || fieldValue === null ? false : fieldValue;
  } else {
    return fieldValue;
  }
};

/**
 * Validate the GraphQL naming convetions & protect specific fields.
 *
 * @param {any} key
 * @returns the valid name
 */
function getValidKey({ key, verbose = false }) {
  let nkey = String(key);
  const NAME_RX = /^[_a-zA-Z][_a-zA-Z0-9]*$/;
  let changed = false;
  // Replace invalid characters
  if (!NAME_RX.test(nkey)) {
    changed = true;
    nkey = nkey.replace(/-|__|:|\$|\.|\s/g, '_');
  }
  // Prefix if first character isn't a letter.
  if (!NAME_RX.test(nkey.slice(0, 1))) {
    changed = true;
    nkey = `${conflictFieldPrefix}${nkey}`;
  }
  if (restrictedNodeFields.includes(nkey)) {
    changed = true;
    nkey = `${conflictFieldPrefix}${nkey}`.replace(/-|__|:|\$|\.|\s/g, '_');
  }
  if (changed && verbose) log(chalk`{bgCyan Plugin ApiServer} Object with key "${key}" breaks GraphQL naming convention. Renamed to "${nkey}"`);

  return nkey;
}

exports.getValidKey = getValidKey;

// Standardize ids + make sure keys are valid.
const standardizeKeys = entities => entities.map(e => deepMapKeys(e, key => key === `ID` ? getValidKey({ key: `id` }) : getValidKey({ key })));

// Generate a unique id for each entity
const createGatsbyId = createNodeId => createNodeId(`${nanoid()}`);

// Add entity type to each entity
const createEntityType = (entityType, entities) => entities.map(e => {
  e.__type = entityType;
  return e;
});