## get-file

Download a file and optionally extract it.

```
var assert = require('assert')
var download = require('get-file'))

download('https://codeload.github.com/kmalakoff/node-tests-data/zip/v1.0.0', fullPath, { extract: true, strip: 1 }, function(err) {

})

await download('https://codeload.github.com/kmalakoff/node-tests-data/zip/v1.0.0', fullPath, { extract: true, strip: 1 })
```
