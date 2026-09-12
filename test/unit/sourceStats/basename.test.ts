import assert from 'assert';
import { getBasename, type Source } from 'get-remote';

describe('basename', () => {
  it('sanitize invalid filename characters', () => {
    // Test POSIX invalid characters are replaced with '!'
    // Note: ? is a query string delimiter in URLs, so it gets stripped not sanitized
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/foo*bar.tar'), 'foo!bar.tar');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/foo<bar>.tar'), 'foo!bar!.tar');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/foo:bar.tar'), 'foo!bar.tar');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/foo"bar.tar'), 'foo!bar.tar');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/foo|bar.tar'), 'foo!bar.tar');

    // Test Windows reserved names are replaced
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/con'), '!');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/prn'), '!');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/aux'), '!');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/nul'), '!');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/com1'), '!');
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/lpt9'), '!');

    // Test query strings are stripped before sanitization
    assert.equal(getBasename(null as unknown as Source, {}, 'http://example.com/file.tar?query=value'), 'file.tar');
  });
});
