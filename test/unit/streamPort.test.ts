import assert from 'assert';
import get from 'get-remote';
import * as http from 'http';

// node 0.x streams through a blocking child process, so a server in this same process can never answer
const major = +process.versions.node.split('.')[0];
(major === 0 ? describe.skip : describe)('stream honors the port in the URL', () => {
  let server: http.Server;
  let port: number;

  before((done) => {
    server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('hello');
    });
    server.listen(0, '127.0.0.1', () => {
      port = (server.address() as { port: number }).port;
      done();
    });
  });

  after((done) => {
    server.close(() => done());
  });

  it('reaches a server on a non-default port', (done) => {
    get(`http://127.0.0.1:${port}/file.txt`).stream((err, stream) => {
      if (err || !stream) return done(err ?? new Error('No stream'));
      let body = '';
      stream.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      stream.on('end', () => {
        assert.equal(body, 'hello');
        done();
      });
    });
  });
});
