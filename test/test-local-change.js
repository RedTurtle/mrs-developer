const fs = require('fs');

module.exports = function testLocalChange() {
  fs.appendFileSync('./test/src/develop/repo1/file1.txt', 'Local change\n');
};
