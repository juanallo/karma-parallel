'use strict';

// jshint node: true

module.exports = {
  'framework:parallelize': ['type', require('./framework')],
  'middleware:parallelize': ['factory', require('./middleware')],
  'reporter:parallelize-coverage': ['type', require('./reporter')]
};
