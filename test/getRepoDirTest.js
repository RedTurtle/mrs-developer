'use strict';

const chai = require('chai');
const fs = require('fs');
const developer = require('../src/index.js');
const expect = chai.expect;
const testClean = require('./test-clean');

describe('getRepoDir', () => {
  it('creates the ./src/develop folder if it does not exist', () => {
    developer.getRepoDir('./test');
    expect(fs.existsSync('./test/src/develop')).to.be.true;
  });

  afterEach(() => {
    testClean();
  });
});
