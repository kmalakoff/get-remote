## get-remote

Download text or JSON, save a response to a file, stream it, extract an archive, or send a HEAD request. The API supports callbacks and Promises.

```bash
npm install get-remote
```

### Promise API

This example is an ES module and uses top-level `await`. It reads public package metadata from the npm registry.

```js
import get from 'get-remote';
import fs from 'node:fs';
import path from 'node:path';

const url = 'https://registry.npmjs.org/get-remote/latest';
const response = await get(url).json();
console.log(response.statusCode, response.body.name); // 200 get-remote

await get(url).file(process.cwd(), {
  filename: 'get-remote.json'
});

await get(url).pipe(
  fs.createWriteStream(path.join(process.cwd(), 'get-remote-copy.json'))
);
```

The response methods return status and headers along with the parsed JSON or text body. `stream()` returns the response stream, `head()` returns status and headers, and `file()` infers a filename unless you provide one.

### Callback API

```js
const get = require('get-remote');

get('https://registry.npmjs.org/get-remote/latest').text(function (error, response) {
  if (error) throw error;
  console.log(response.statusCode, JSON.parse(response.body).name); // 200 get-remote
});
```

### Archive extraction

Install `fast-extract` when you want `extract()` to unpack an archive:

```bash
npm install fast-extract
```

```js
await get('https://your-service.example/archive.tar.gz').extract(process.cwd(), { strip: 1 });
```

Replace the URL with an archive endpoint you control. Without `fast-extract`, `extract()` downloads the compressed file without unpacking it and reports a warning.

The package supports Node >=0.8 and is MIT licensed. See the [API docs](https://kmalakoff.github.io/get-remote/) and [GitHub issues](https://github.com/kmalakoff/get-remote/issues).
