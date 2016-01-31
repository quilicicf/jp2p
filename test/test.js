var parser = require('../index.js');
var fs = require('fs');
var _ = require('lodash-node');
var assert   = require('assert');

var resourcesDir = __dirname + '/resources';
var jsonDir = resourcesDir + '/json';
var expectationsDir = resourcesDir + '/expectations';

var _getAllFilesFromFolder = function(dir) {
  var results = [];

  fs.readdirSync(dir).forEach(function(file) {

    var absolutePathFile = dir + '/' + file;
    var stat = fs.statSync(absolutePathFile);

    if (stat && stat.isDirectory()) {
      results = results.concat(_getAllFilesFromFolder(absolutePathFile));
    } else {
      results.push(file);
    }
  });
  return results;
};

var jsonFiles = _getAllFilesFromFolder(jsonDir);
var expectationsFiles = _getAllFilesFromFolder(expectationsDir);

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
  var json = fs.readFileSync(jsonDir + '/' + file, 'utf8');
  var expectations = JSON.parse(fs.readFileSync(expectationsDir + '/' + file, 'utf8'));

  _.each(expectations, function (expectation) {
    console.log('Checking', file, expectation);
    assert.equal(expectation.line, parser.getLineNumber(json, expectation.jsonPointer));
  });

});
