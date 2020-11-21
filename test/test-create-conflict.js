const fs = require('fs');
const simpleGit = require('simple-git');

module.exports = async function testCreateConflict() {
  process.chdir('./test/src/develop/repo1');
  const git = simpleGit({ baseDir: '.' });
  fs.appendFileSync('file1.txt', 'Totally new content\n');
  await git.add(['file1.txt']);
  await git.commit('I modify file1 too');
  process.chdir('../../../..');
};
