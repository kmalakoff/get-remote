## get-remote

Download a file and optionally extract it.

```
var assert = require('assert')
var download = require('get-remote'))

download('https://codeload.github.com/kmalakoff/node-tests-data/zip/v1.0.0', fullPath, { extract: true, strip: 1 }, function(err) {

})

await download('https://codeload.github.com/kmalakoff/node-tests-data/zip/v1.0.0', fullPath, { extract: true, strip: 1 })
```
