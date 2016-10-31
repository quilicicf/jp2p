'use strict';

let assert = require('chai').assert,
  parser = require('../index.js'),
  fs = require('fs'),
  fr = require('../lib/folderReader.js'),
  _ = require('lodash');

describe('jp2p', () => {
  let resourcesDir = __dirname + '/resources';
  let jsonDir = resourcesDir + '/json';
  let expectationsDir = resourcesDir + '/expectations';

  let jsonFiles = fr._getFilesFromFolder(jsonDir);
  let expectationsFiles = fr._getFilesFromFolder(expectationsDir);

  if (!_.isEqual(jsonFiles, expectationsFiles)) {
    let missingExpectationsFiles = _.difference(jsonFiles, expectationsFiles);
    if (!_.isEmpty(missingExpectationsFiles)) {
      throw new Error('Some JSON files do not have their expectations: ' + JSON.stringify(missingExpectationsFiles));
    }

    var missingJsonFiles = _.difference(expectationsFiles, jsonFiles);
    if (!_.isEmpty(missingJsonFiles)) {
      throw new Error('Some expectations files do not have their JSON: ' + JSON.stringify(missingJsonFiles));
    }
  }

  _.each(jsonFiles, file => {
    describe('file ' + file, () => {
      let json = fs.readFileSync(jsonDir + '/' + file, 'utf8');
      let expectations = JSON.parse(fs.readFileSync(expectationsDir + '/' + file, 'utf8'));

      _.each(expectations, expectation => {
        it('should return ' + JSON.stringify(expectation.location) + ' for JSON pointer ' + expectation.jsonPointer, () => {
          let actual = parser.getLineNumber(json, expectation.jsonPointer);
          assert.deepEqual(expectation.location, actual);
        });
      });
    });
  });
});
