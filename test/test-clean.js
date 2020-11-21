const rimraf = require('rimraf');

module.exports = function testClean() {
  rimraf.sync('./test/src/develop');
  rimraf.sync('./test/fake-remote');
};
