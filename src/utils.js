const util = require('util');
const fs = require('fs');
const safeStringify = require('fast-safe-stringify');

function debug(value) {
  console.log(util.inspect(value, {
    depth: null,
    colors: true,
  }));
}

async function With(context, callback) {
  try {
    const entered = await context.enter();
    return await callback(entered);
  } finally {
    await context.exit();
  }
}

function flatten(array) {
  const result = [];

  function doFlatten(item) {
    if (Array.isArray(item)) {
      item.forEach(it => doFlatten(it));
    } else {
      result.push(item);
    }
  }

  doFlatten(array);

  return result;
}

function loadJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf-8'));
}

function saveJson(filename, obj, indent = 2) {
  fs.writeFileSync(filename, safeStringify(obj, null, 2));
}

function by(property) {
  const fn = (a, b) => {
    const pa = a[property];
    const pb = b[property];
    return (pa > pb) - (pb > pa);
  };

  fn.desc = (a, b) => -fn(a, b);
  return fn;
}

function maybe(cb) {
  try {
    return cb();
  } catch (e) {
    return null;
  }
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Required env missing: ${name}`);
  }

  return value;
}

module.exports = {
  debug,
  With,
  loadJson,
  saveJson,
  flatten,
  by,
  requiredEnv,
  maybe,
};
