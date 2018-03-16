'use strict';

/**
 * Instrument Karma to setup browsers and required middleware.
 */

const path = require('path');

// jshint node: true

/**
 * Init configuration with defaults.
 * @param fullConfig config received from Karma
 * @returns {{}} Config with karma-parallelize required elements.
 */
function extendConfig(fullConfig) {
  // ensure we can manipulate config settings
  const config = fullConfig.parallelOptions = (fullConfig.parallelOptions || {});
  config.shardIndexMap = {};
  config.nextShardIndex = {};
  config.browserIdAlias = {};
  config.shardStrategy = config.shardStrategy || 'round-robin';
  config.aggregatedReporterTest = ('aggregatedReporterTest' in config) ? config.aggregatedReporterTest : /coverage|istanbul|junit/i;
  config.executors = Math.max(1, config.executors || require('os').cpus().length - 1);
  return config;
}

/**
 * Inject karma-parallelize middleware into Karma (In case it was not injected manually)
 * @param log common karma-parallelize log
 * @param fullConfig {beforeMiddleware}
 */
function setupMiddleware(log, fullConfig) {
  // ensure we load our middleware before karma's middleware for sharding
  fullConfig.beforeMiddleware = fullConfig.beforeMiddleware ? fullConfig.beforeMiddleware : [];
  if (fullConfig.beforeMiddleware.indexOf('parallelize') === -1) {
    log.debug('adding "parallelize" beforeMiddleware to configuration');
    //TODO do we need to unshift? or just pushing is fine? Do we need to be first?
    fullConfig.beforeMiddleware.unshift('parallelize');
  }
}

/**
 * Adds browsers to the list based on the # of executors.
 * @param config {executors}
 * @param browsers list of karma specified browsers.
 * @param log common log.
 */
function addParallelBrowsers(config, browsers, log) {
  const executors = config.executors;
  if (executors > 1) {
    for (let i = 0, ii = browsers.length; i<ii; i++) {
      const shardedBrowsers = new Array(executors - 1).fill(browsers[i]);
      browsers.push.apply(browsers, shardedBrowsers);
    }
    browsers.sort();
  }
  log.info('sharding specs across', config.executors, config.executors === 1 ? 'browser' : 'browsers');
}

// TODO: Browser unregister??
// We likely need to reset our shard indexes and browser-id aliases
// if we restart our browsers or if connections get reset.
function handleBrowserRegister(log, config, browser) {
  // Create a alias Id for each browser.name. Used in identifying coverage reports
  config.browserIdAlias[browser.name] = config.browserIdAlias[browser.name] || Math.floor(Math.random()*Date.now());
  config.nextShardIndex[browser.name] = config.nextShardIndex[browser.name] || 0;
  config.shardIndexMap[browser.id] = config.nextShardIndex[browser.name];
  log.debug(`registering browser id ${browser.id} with aggregated browser id ${config.browserIdAlias[browser.name]} at shard index ${config.shardIndexMap[browser.id]}`);
  config.nextShardIndex[browser.name]++;
}


module.exports = function(config, emitter, logger) {
  if (config.frameworks[0] !== 'parallelize') {
    // We have to be loaded first to make sure we load our parallelizer script *after* the jasmine/mocha script runs
    throw new Error(`The "parallelize" framework must be loaded first into the karma frameworks array. \nActual: config.frameworks: ${JSON.stringify(config.frameworks)}`);
  }

  //inject the parallelizer.
  config.files.unshift({pattern: path.join(__dirname, 'karma-parallelizer.js'), included: true, served: true, watched: false});
  config.files.unshift({pattern: path.join(__dirname, 'client/**/*'), included: true, served: true, watched: false});

  const log = logger.create('framework:karma-parallelize');
  const finalConfig = extendConfig(config);

  setupMiddleware(log, config);
  addParallelBrowsers(finalConfig, config.browsers, log);

  emitter.on('browser_register', (browser) => handleBrowserRegister(log, finalConfig, browser));
};
