import assert from 'assert';
import fs from 'fs';
import { safeRmSync } from 'fs-remove-compat';
import get from 'get-remote';
import * as http from 'http';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
// not under .tmp: other suites empty it before each test
const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp', 'rename');
const BODY = new Array(1001).join('0123456789');

// node 0.x streams through a blocking child process, so a server in this same process can never answer
const major = +process.versions.node.split('.')[0];
// a cut-off download must be an error and must never leave (or rename) a partial file
(major === 0 ? describe.skip : describe)('file temporary name then rename', () => {
  let server: http.Server;
  let port: number;

  before((done) => {
    server = http.createServer((req, res) => {
      if (req.url === '/full') {
        res.writeHead(200, { 'Content-Length': BODY.length });
        return res.end(BODY);
      }
      // promise more than is sent, then drop the socket mid-body
      res.writeHead(200, { 'Content-Length': BODY.length });
      res.write(BODY.slice(0, 100));
      setTimeout(() => req.socket.destroy(), 50);
    });
    server.listen(0, '127.0.0.1', () => {
      port = (server.address() as { port: number }).port;
      done();
    });
  });

  after((done) => {
    server.close(() => done());
  });

  beforeEach(() => {
    safeRmSync(TEMP_DIR);
    mkdirp.sync(TEMP_DIR);
  });

  it('complete download: dest has the full content and no temporary file is left', (done) => {
    get(`http://127.0.0.1:${port}/full`).file(TEMP_DIR, { filename: 'file.txt' }, (err?: Error | null) => {
      if (err) return done(err);
      assert.equal(fs.readFileSync(path.join(TEMP_DIR, 'file.txt'), 'utf8'), BODY);
      assert.deepEqual(fs.readdirSync(TEMP_DIR), ['file.txt']);
      done();
    });
  });

  it('cut-off download: error, no dest, no temporary file', (done) => {
    get(`http://127.0.0.1:${port}/cut`).file(TEMP_DIR, { filename: 'file.txt' }, (err?: Error | null) => {
      assert.ok(err, 'expected an error');
      assert.deepEqual(fs.readdirSync(TEMP_DIR), []);
      done();
    });
  });

  it('cut-off download leaves an existing dest unchanged', (done) => {
    fs.writeFileSync(path.join(TEMP_DIR, 'file.txt'), 'old content');
    get(`http://127.0.0.1:${port}/cut`).file(TEMP_DIR, { filename: 'file.txt' }, (err?: Error | null) => {
      assert.ok(err, 'expected an error');
      assert.equal(fs.readFileSync(path.join(TEMP_DIR, 'file.txt'), 'utf8'), 'old content');
      assert.deepEqual(fs.readdirSync(TEMP_DIR), ['file.txt']);
      done();
    });
  });

  it('dest is a non-empty directory: fails and leaves no temporary file', (done) => {
    const dest = path.join(TEMP_DIR, 'file.txt');
    mkdirp.sync(dest);
    fs.writeFileSync(path.join(dest, 'inner.txt'), 'inner');
    get(`http://127.0.0.1:${port}/full`).file(TEMP_DIR, { filename: 'file.txt' }, (err?: Error | null, result?: string) => {
      assert.ok(err, 'expected an error');
      assert.ok(!result);
      assert.ok(fs.statSync(dest).isDirectory());
      assert.deepEqual(fs.readdirSync(TEMP_DIR), ['file.txt']);
      done();
    });
  });
});
