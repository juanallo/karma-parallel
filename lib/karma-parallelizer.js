'use strict';

/**
 * Run in every Browser to define which tests should be run.
 */

//region dependencies

// const TestStrategyFactory = require('./parallelizer/TestStrategyFactory');

//endregion

const TestStrategyFactory = {
  create: (shardIndexInfo)  => {
    return TestStrategyFactory[shardIndexInfo.shardStrategy](shardIndexInfo);
  },
  'round-robin': (shardIndexInfo) => {
    const shardIndex = shardIndexInfo.shardIndex,
      executors = shardIndexInfo.executors;
    // Increment the count on each top level describe to determine
    // round-robin responsibility
    let count = 0;
    return function(/*description, specDefinitions*/) {
      return count++ % executors === shardIndex;
    };
  },
  'description-length': (shardIndexInfo) => {
    const shardIndex = shardIndexInfo.shardIndex,
      executors = shardIndexInfo.executors;
    return function overrideSpecSuite(description/*, specDefinitions*/) {
      return description.length % executors === shardIndex;
    };
  }
};

function initKarmaParallelizer(root, karma, shardIndexInfo) {
  if (!shardIndexInfo || !shardIndexInfo.shouldShard) {
    // console.log('Skipping sharding. Could not find index and count values');
    return;
  }

  const strategy = TestStrategyFactory.create(shardIndexInfo);
  createMochaParallelSetup(root, strategy);

  const origStart = karma.start;
  karma.start = function() {
    origStart.call(this);
  };
}

function createMochaParallelSetup(ctx, shouldRun) {
  // On focus spec in mocha we need to return the test result and need to
  function wrap(fn) {
    return function(name, def) {
      if(shouldRun(name, def)){
        fn(name, def);
      }
    };
  }

  ctx.mocha.parallelSetup = function(opts) {
    if(opts === 'bdd'){
      const skip = ctx.describe.skip;
      ctx.describe = wrap(ctx.describe);
      ctx.describe.skip = skip;
    }
    else if(opts === 'tdd'){
      const skip = ctx.suite.skip;
      ctx.suite = wrap(ctx.suite);
      ctx.suite.skip = skip;
    }
  };
}

initKarmaParallelizer(window, window.__karma__, JSON.parse('%KARMA_SHARD_INFO%'));

