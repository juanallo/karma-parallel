'use strict';

/**
 * Run in every Browser to define which tests should be run.
 */



window['karma-parallelizer'].Parallelizer = function (window) {

  //region dependencies

  const TestStrategyFactory = window['karma-parallelizer'].TestStrategyFactory,
        FrameworkInject = window['karma-parallelizer'].FrameworkInject;

  //endregion


  function initKarmaParallelizer(root, karma, shardInformation) {
    if (!shardInformation || !shardInformation.shouldShard) {
      // console.log('Skipping sharding. Could not find index and count values');
      return;
    }

    const strategy = TestStrategyFactory.create(shardInformation);
    FrameworkInject.inject(shardInformation.frameworks, root, strategy);

    const origStart = karma.start;
    karma.start = function() {
      origStart.call(this);
    };
  }

  initKarmaParallelizer(window, window.__karma__, JSON.parse('%KARMA_SHARD_INFO%'));
}(window);



