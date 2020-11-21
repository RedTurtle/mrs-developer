'use strict';

const chai = require('chai');
const developer = require('../src/index.js');
const expect = chai.expect;
const testSetup = require('./test-setup');
const testClean = require('./test-clean');

describe('openRepository', () => {
  beforeEach(async () => {
    await testSetup();
    await Promise.resolve(developer.getRepoDir('./test'));
  });

  it('opens an existing repository', async () => {
    await developer.cloneRepository(
      'repo1',
      './test/src/develop/repo1',
      './test/fake-remote/repo1'
    );
    const repo = await developer.openRepository(
      'repo1',
      './test/src/develop/repo1'
    );
    const remotes = await repo.getRemotes();
    expect(remotes[0].name).to.be.equal('origin');
  });

  afterEach(() => {
    testClean();
  });
});
