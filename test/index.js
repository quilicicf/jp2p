var should = require('chai').should(),
    ds = require('../index'),
    parser = require('../index.js'),
    fs = require('fs'),
    fr = require('../lib/folderReader.js'),
    _ = require('lodash-node'),
    assert = require('assert');

describe('jsonPointer2lineNumber' , function () {
  var resourcesDir = __dirname + '/resources';
  var jsonDir = resourcesDir + '/json';
  var expectationsDir = resourcesDir + '/expectations';

  var jsonFiles = fr._getFilesFromFolder(jsonDir);
  var expectationsFiles = fr._getFilesFromFolder(expectationsDir);

  if (!_.isEqual(jsonFiles, expectationsFiles)) {
    var missingExpectationsFiles = _.difference(jsonFiles, expectationsFiles);
    if (!_.isEmpty(missingExpectationsFiles)) {
      throw new Error('Some JSON files do not have their expectations: ' + JSON.stringify(missingExpectationsFiles));
    }

    var missingJsonFiles = _.difference(expectationsFiles, jsonFiles);
    if (!_.isEmpty(missingJsonFiles)) {
      throw new Error('Some expectations files do not have their JSON: ' + JSON.stringify(missingJsonFiles));
    }
  }

  _.each(jsonFiles, function (file) {
    describe('file ' + file, function() {
      var json = fs.readFileSync(jsonDir + '/' + file, 'utf8');
      var expectations = JSON.parse(fs.readFileSync(expectationsDir + '/' + file, 'utf8'));

      _.each(expectations, function (expectation) {
        it('should return ' + JSON.stringify(expectation.location) + ' for JSON pointer ' + expectation.jsonPointer, function() {
          var actual = parser.getLineNumber(json, expectation.jsonPointer);
          assert.equal(JSON.stringify(expectation.location), JSON.stringify(actual));
        });
      });
    });
  });
});
