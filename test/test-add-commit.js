const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

module.exports = async function testAddCommit() {
  process.chdir('./test/fake-remote/repo1');
  const git = simpleGit({ baseDir: path.resolve('.') });
  await git.checkout('staging');
  fs.appendFileSync('file1.txt', 'And one more\n');
  await git.add(['file1.txt']);
  await git.commit('Modify file 1 again');
  await git.checkout('master');
  process.chdir('../../..');
};
