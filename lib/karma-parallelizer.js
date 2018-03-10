'use strict';

// This file gets loaded into the executing browsers and overrides the `describe` functions

function initKarmaParallelizer(root, karma, shardIndexInfo) {
  if (!shardIndexInfo || !shardIndexInfo.shouldShard) {
    // console.log('Skipping sharding. Could not find index and count values');
    return;
  }

  var strategy = getSpecSuiteStrategy(shardIndexInfo);
  var fakeContextStatus = createFakeTestContext(root, strategy);

  var origStart = karma.start;
  karma.start = function() {
    fakeContextStatus.beforeStartup();
    origStart.call(this);
  };
}

function getSpecSuiteStrategy(shardIndexInfo) {
  switch (shardIndexInfo.shardStrategy) {
    case 'description-length':
      return createDescriptionLengthStragegy(shardIndexInfo);
    case 'round-robin':
    /* falls through */
    default:
      return createRoundRobinStrategy(shardIndexInfo);
  }
}

function createDescriptionLengthStragegy(shardIndexInfo) {
  var
    shardIndex = shardIndexInfo.shardIndex,
    executors = shardIndexInfo.executors;
  return function overrideSpecSuite(description/*, specDefinitions*/) {
    return description.length % executors === shardIndex;
  };
}

function createRoundRobinStrategy(shardIndexInfo) {
  var
    shardIndex = shardIndexInfo.shardIndex,
    executors = shardIndexInfo.executors;
  // Increment the count on each top level describe to determine
  // round-robin responsibility
  var count = 0;
  return function(/*description, specDefinitions*/) {
    return count++ % executors === shardIndex;
  };
}


function createFakeTestContext(ctx, shouldRun) {
  // On focus spec in mocha we need to return the test result and need to
  function wrap(fn) {
    return function(name, def) {
      if(shouldRun(name, def)){
        fn(name, def);
      }
    };
  }

  window.mocha.parallelSetup = function(opts) {
    if(opts === 'bdd'){
      var skip = window.describe.skip;
      window.describe = wrap(window.describe);
      window.describe.skip = skip;
    }
    else if(opts === 'tdd'){
      var skip = window.suite.skip;
      window.suite = wrap(window.suite);
      window.suite.skip = skip;
    }
  };

  return {
    beforeStartup: function() {
    }
  };
}

initKarmaParallelizer(window, window.__karma__, JSON.parse('%KARMA_SHARD_INFO%'));

