'use strict';

if(!window['karma-parallelizer']) {
  window['karma-parallelizer'] = {};
}

window['karma-parallelizer'].MochaInjection = function () {
  return {
    inject: (ctx, wrapper) => {
      ctx.mocha.parallelSetup = function(opts) {
        if(opts === 'bdd'){
          const skip = ctx.describe.skip;
          ctx.describe = wrapper(ctx.describe);
          ctx.describe.skip = skip;
        }
        else if(opts === 'tdd'){
          const skip = ctx.suite.skip;
          ctx.suite = wrapper(ctx.suite);
          ctx.suite.skip = skip;
        }
      };
    }
  };
}();

window['karma-parallelizer'].FrameworkInject = function () {

  const MochaInjection = window['karma-parallelizer'].MochaInjection;

  return {
    inject: (frameworks, ctx, strategy) => {

        function wrap(fn) {
          return function(name, def) {
            if(strategy(name, def)){
              fn(name, def);
            }
          };
        }

        if(frameworks.indexOf('mocha') >= 0){
          MochaInjection.inject(ctx, wrap);
        }
    }
  };
}();
