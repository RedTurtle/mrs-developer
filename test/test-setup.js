const fs = require('fs');
const rimraf = require('rimraf');
const simpleGit = require('simple-git');

module.exports = async function testSetup() {
  process.chdir('./test');
  rimraf.sync('src');
  rimraf.sync('fake-remote');
  fs.mkdirSync('src');
  fs.mkdirSync('fake-remote');
  process.chdir('./fake-remote');
  const git = simpleGit({ baseDir: '.' });
  await git.init(['repo1']);
  process.chdir('./repo1');
  fs.writeFileSync('file1.txt', 'fffile 1\n');
  await git.add(['file1.txt']);
  await git.commit('Add file 1');
  await git.checkoutLocalBranch('conflicting');
  rimraf.sync('file1.txt');
  await git.add(['file1.txt']);
  await git.commit('Delete file 1');
  await git.checkout('master');
  fs.writeFileSync('file1.txt', 'File 1\n');
  await git.add(['file1.txt']);
  await git.commit('Add file 1', undefined, {
    '--amend': true,
    '--no-edit': true,
  });
  await git.addTag('1.0.0');
  fs.writeFileSync('file2.txt', 'File 2\n');
  await git.add(['file2.txt']);
  await git.commit('Add file 2');
  await git.checkoutLocalBranch('staging');
  fs.appendFileSync('file1.txt', 'More text\n');
  await git.add(['file1.txt']);
  await git.commit('Modify file 1');
  await git.checkout('master');
  process.chdir('../../..');
};
