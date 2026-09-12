import assert from 'assert';
import fs from 'fs';
import { fileType } from 'get-remote';
import path from 'path';

import { DATA_DIR } from '../../lib/constants.ts';

describe('fileType', () => {
  it('detect various archive types from magic bytes', () => {
    // Test file type detection with local test fixtures

    // Test ZIP
    const zipBuffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.zip'));
    const zipResult = fileType(zipBuffer);
    assert.ok(zipResult, 'Expected zip to be detected');
    assert.equal(zipResult.ext, 'zip');

    // Test GZIP
    const gzBuffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.tar.gz'));
    const gzResult = fileType(gzBuffer);
    assert.ok(gzResult, 'Expected gzip to be detected');
    assert.equal(gzResult.ext, 'gz');

    // Test BZIP2
    const bz2Buffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.tar.bz2'));
    const bz2Result = fileType(bz2Buffer);
    assert.ok(bz2Result, 'Expected bzip2 to be detected');
    assert.equal(bz2Result.ext, 'bz2');

    // Test XZ
    const xzBuffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.tar.xz'));
    const xzResult = fileType(xzBuffer);
    assert.ok(xzResult, 'Expected xz to be detected');
    assert.equal(xzResult.ext, 'xz');

    // Test TAR (uncompressed)
    const tarBuffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.tar'));
    const tarResult = fileType(tarBuffer);
    assert.ok(tarResult, 'Expected tar to be detected');
    assert.equal(tarResult.ext, 'tar');
  });
});
