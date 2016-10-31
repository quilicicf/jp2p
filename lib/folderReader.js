module.exports = (() => {
  'use strict';

  const fs = require('fs');
  let _getFilesFromFolder = dir => {
    let results = [];

    fs.readdirSync(dir).forEach(file => {

      const absolutePathFile = dir + '/' + file;
      const stat = fs.statSync(absolutePathFile);

      if (stat && stat.isDirectory()) {
        results = results.concat(_getFilesFromFolder(absolutePathFile));
      } else {
        results.push(file);
      }
    });
    return results;
  };

  return {
    _getFilesFromFolder: _getFilesFromFolder
  };
})();
