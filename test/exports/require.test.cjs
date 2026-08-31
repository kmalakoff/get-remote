const assert = require('assert');
const { default: getRemote, fileType, getBasename, Response } = require('get-remote');

describe('exports .cjs', () => {
  it('default', () => {
    assert.equal(typeof getRemote, 'function');
  });
  it('fileType', () => {
    assert.equal(typeof fileType, 'function');
  });
  it('getBasename', () => {
    assert.equal(typeof getBasename, 'function');
  });
  it('Response', () => {
    assert.equal(typeof Response, 'function');
  });
});
