import assert from 'assert';
import getRemote, { fileType, getBasename, Response } from 'get-remote';

describe('exports .mjs', () => {
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
