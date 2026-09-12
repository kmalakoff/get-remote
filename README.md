## get-remote

Download a file and optionally extract it.

```
var assert = require('assert')
var download = require('get-remote'))

download('https://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', fullPath, { extract: true, strip: 1 }, function(err) {

})

await download('https://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', fullPath, { extract: true, strip: 1 })
```
