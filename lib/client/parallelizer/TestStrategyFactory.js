'use strict';

if(!window['karma-parallelizer']) {
  window['karma-parallelizer'] = {};
}

window['karma-parallelizer'].TestStrategyFactory = function () {
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

  return TestStrategyFactory;
} ();
