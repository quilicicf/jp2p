const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const getFilesFromFolder = (dir) => {
  return _.reduce(
    fs.readdirSync(dir),
    (seed, file) => {
      const absolutePathFile = path.resolve(dir, file);
      const stat = fs.statSync(absolutePathFile);

      if (stat && stat.isDirectory()) {
        return _.concat(seed, getFilesFromFolder(absolutePathFile));
      }

      return _.concat(seed, file);
    },
    []
  );
};

module.exports = { getFilesFromFolder };
