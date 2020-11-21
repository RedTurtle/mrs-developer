const fs = require('fs');
const simpleGit = require('simple-git');

module.exports = async function testCreateTags() {
  process.chdir('./test/fake-remote/repo1');
  const git = simpleGit({ baseDir: '.' });
  fs.appendFileSync('file1.txt', 'Knowledge is power\n');
  await git.add(['file1.txt']);
  await git.commit('new change');
  await git.addTag('1.0.9');
  fs.appendFileSync('file1.txt', 'France is bacon\n');
  await git.add(['file1.txt']);
  await git.commit('really?');
  await git.addTag('1.0.11');
  fs.appendFileSync('file1.txt', 'Francis Bacon\n');
  await git.add(['file1.txt']);
  await git.commit('fix quote');
  await git.addTag('1.0.10');
  process.chdir('../../..');
};
