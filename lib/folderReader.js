module.exports = (function () {
  'use strict';

  var fs = require('fs');
  return {
    _getFilesFromFolder: function(dir) {
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
    }
  };
})();
