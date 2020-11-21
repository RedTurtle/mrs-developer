'use strict';

const chai = require('chai');
const developer = require('../src/index.js');
const expect = chai.expect;
const simpleGit = require('simple-git');
const testSetup = require('./test-setup');
const testAddCommit = require('./test-add-commit');
const testClean = require('./test-clean');

describe('checkoutRepository', () => {
  beforeEach(async () => {
    await testSetup();
    await developer.getRepoDir('./test');
  });

  it('clones the repository locally and checkout the proper branch', async () => {
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-remote/repo1',
        branch: 'staging',
      },
      {}
    );
    const repo = await developer.openRepository(
      'repo1',
      './test/src/develop/repo1'
    );
    const status = await repo.status();
    expect(status.current).to.be.equal('staging');
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Modify file 1');
  });

  it('fetchs last changes if repository exists', async () => {
    await developer.cloneRepository(
      'repo1',
      './test/src/develop/repo1',
      './test/fake-remote/repo1'
    );
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-remote/repo1',
        branch: 'staging',
      },
      {}
    );

    // now let's make a change in the remote
    await testAddCommit();

    // and checkout
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-remote/repo1',
        branch: 'staging',
      },
      {}
    );
    const repo = await simpleGit({ baseDir: './test/src/develop/repo1' });
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Modify file 1 again');
  });

  it('does not fetchs last changes if noFetch', async () => {
    await developer.cloneRepository(
      'repo1',
      './test/src/develop/repo1',
      './test/fake-remote/repo1'
    );
    await developer.checkoutRepository('repo1', './test/src/develop', {
      url: './test/fake-remote/repo1',
      branch: 'staging',
    });

    // now let's make a change in the remote
    await testAddCommit();

    // and checkout
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-remote/repo1',
        branch: 'staging',
      },
      { noFetch: true }
    );
    const repo = await simpleGit({ baseDir: './test/src/develop/repo1' });
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Modify file 1');
  });

  afterEach(() => {
    testClean();
  });
});
