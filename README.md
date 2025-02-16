# urlex

A lightweight package to identify and extract URLs from text.

> Unicode support

# Usage

Returns an array of all URLs found in the input text.

```javascript
import urlex from 'urlex'

const text = 'Visit http://example.com/home for details.'
const response = urlex(text)
console.log(response)
// [ 'http://example.com/home' ]
```

To get the parts of the URL, use the `needParts` option.

```javascript
import urlex from 'urlex'

const text = 'Visit http://example.com/home for details.'
const response = urlex(text, { needParts: true })
console.log(response)
// [
//   {
//     url: 'http://example.com',
//     protocol: 'http://',
//     auth: '',
//     ip: '',
//     subdomain: '',
//     domain: 'example.com',
//     tld: 'com',
//     port: '',
//     path: '/home',
//   }
// ]
```

To match the url without protocol, use the `withProtocol` option.

```javascript
import urlex from 'urlex'

const text = 'Visit example.com/home for details.'
const response = urlex(text, { withProtocol: false })
console.log(response)
// [ 'example.com/home' ]
```

To match other protocols, use the `webOnly` option.

```javascript
import urlex from 'urlex'

const text = 'Send mail to smtp://test.com/home for details.'
const response = urlex(text, { webOnly: false })
console.log(response)
// [ 'smtp://test.com/home' ]
```

# Credits

- [sindresorhus](https://github.com/sindresorhus/ip-regex)
- [kevva](https://github.com/kevva/url-regex)
- [131](https://github.com/131/node-tld)
- [Public Suffix](https://publicsuffix.org/)
