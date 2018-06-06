'use strict';

const _ = require('lodash');
const path = require('path');
const assert = require('chai').assert;
const parser = require('../index.js');
const fs = require('fs');
const { getFilesFromFolder } = require('../lib/folderReader.js');

describe('jp2p', () => {
  const resourcesDir = path.resolve(__dirname, 'resources');
  const jsonDir = path.resolve(resourcesDir, 'json');
  const expectationsDir = path.resolve(resourcesDir, 'expectations');

  const jsonFiles = getFilesFromFolder(jsonDir);
  const expectationsFiles = getFilesFromFolder(expectationsDir);

  if (!_.isEqual(jsonFiles, expectationsFiles)) {
    const missingExpectationsFiles = _.difference(jsonFiles, expectationsFiles);
    if (!_.isEmpty(missingExpectationsFiles)) {
      throw new Error(`Some JSON files do not have their expectations: ${JSON.stringify(missingExpectationsFiles)}`);
    }

    const missingJsonFiles = _.difference(expectationsFiles, jsonFiles);
    if (!_.isEmpty(missingJsonFiles)) {
      throw new Error(`Some expectations files do not have their JSON: ${JSON.stringify(missingJsonFiles)}`);
    }
  }

  _.each(jsonFiles, file => {
    describe(`file ${file}`, () => {
      const json = fs.readFileSync(path.resolve(jsonDir, file), 'utf8');
      const expectations = JSON.parse(fs.readFileSync(path.resolve(expectationsDir, file), 'utf8'));

      _.each(expectations, expectation => {
        it('should return ' + JSON.stringify(expectation.location) + ' for JSON pointer ' + expectation.jsonPointer, () => {
          const actual = parser.getLineNumber(json, expectation.jsonPointer);
          assert.deepEqual(expectation.location, actual);
        });
      });
    });
  });
});
