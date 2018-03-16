'use strict';

/**
 * Run in every Browser to define which tests should be run.
 */

//region dependencies

const TestStrategyFactory = window['karma-parallelizer'].TestStrategyFactory;

//endregion

window['karma-parallelizer'].Parallelizer = function (window) {
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
}(window);



