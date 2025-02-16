import assert from 'assert'
import urlex from './index.js'

const defaultCondition = [
  {
    number: 'DEF-000',
    name: 'Text without any URL',
    input: 'This is a simple text with no links.',
    options: {},
    expected: [],
  },
  {
    number: 'DEF-001',
    name: 'Simple HTTP URL with protocol',
    input: 'Visit http://example.com for details.',
    options: {},
    expected: ['http://example.com'],
  },
  {
    number: 'DEF-002',
    name: 'Text containing multiple URLs',
    input: 'Visit http://example.com and https://test.org for details.',
    options: { webOnly: false },
    expected: ['http://example.com', 'https://test.org'],
  },
  {
    number: 'DEF-003',
    name: 'Simple WWW URL without protocol',
    input: 'Check out www.example.com for more info.',
    options: {},
    expected: ['www.example.com'],
  },
  {
    number: 'DEF-004',
    name: 'URL with uppercase hostname',
    input: 'Visit HTTP://EXAMPLE.com for details.',
    options: {},
    expected: ['HTTP://EXAMPLE.com'],
  },
  {
    number: 'DEF-005',
    name: 'URL with uppercase TLD',
    input: 'Check out http://example.COM for more info.',
    options: {},
    expected: ['http://example.COM'],
  },
  {
    number: 'DEF-006',
    name: 'URL with a path',
    input: 'Visit http://example.com/path/to/page for details.',
    options: {},
    expected: ['http://example.com/path/to/page'],
  },
  {
    number: 'DEF-007',
    name: 'URL with query parameters',
    input: 'Search results at https://example.com/search?q=test&lang=en.',
    options: {},
    expected: ['https://example.com/search?q=test&lang=en'],
  },
  {
    number: 'DEF-008',
    name: 'URL with fragment',
    input: 'Read more at http://example.com/article#section2.',
    options: {},
    expected: ['http://example.com/article#section2'],
  },
  {
    number: 'DEF-009',
    name: 'URL with path, query parameters, and fragment',
    input: 'Check https://example.com/path?item=123#details for info.',
    options: {},
    expected: ['https://example.com/path?item=123#details'],
  },
  {
    number: 'DEF-010',
    name: 'URL with port number',
    input: 'Server running on http://localhost:3000/api.',
    options: {},
    expected: ['http://localhost:3000/api'],
  },
  {
    number: 'DEF-011',
    name: 'URL in parentheses',
    input: 'See (http://example.com) for details.',
    options: {},
    expected: ['http://example.com'],
  },
  {
    number: 'DEF-012',
    name: 'URL with trailing punctuation',
    input: "Visit http://example.com, and don't miss out!",
    options: {},
    expected: ['http://example.com'],
  },
  {
    number: 'DEF-013',
    name: 'IP address URL',
    input: 'Router config at http://192.168.0.1/settings is accessible.',
    options: {},
    expected: ['http://192.168.0.1/settings'],
  },
  {
    number: 'DEF-014',
    name: 'URL with IPv6 address',
    input: 'Access the server at http://[2001:0db8:85a3::8a2e:0370:7334]/status.',
    options: {},
    expected: ['http://[2001:0db8:85a3::8a2e:0370:7334]/status'],
  },
]

const withoutProtocol = [
  {
    number: 'WOP-001',
    name: 'URL without protocol',
    input: 'Visit example.com for details.',
    options: { withProtocol: false },
    expected: ['example.com'],
  },
  {
    number: 'WOP-011',
    name: 'URL with subdomain',
    input: 'Visit www.example.com for details.',
    options: { withProtocol: false },
    expected: ['www.example.com'],
  },
]

const urlParts = [
  {
    number: 'PRT-001',
    name: 'URL with port and path',
    input: 'Go to http://example.com:8080/path?query=string',
    options: { needParts: true },
    expected: [
      {
        url: 'http://example.com:8080/path?query=string',
        protocol: 'http://',
        auth: '',
        ip: '',
        subdomain: '',
        domain: 'example.com',
        tld: 'com',
        port: '8080',
        path: '/path?query=string',
      },
    ],
  },
  {
    number: 'PRT-002',
    name: 'IPv6 URL extraction',
    input: 'Connect to http://[2001:db8::1]:8080',
    options: { needParts: true },
    expected: [
      {
        url: 'http://[2001:db8::1]:8080',
        protocol: 'http://',
        auth: '',
        ip: '[2001:db8::1]',
        subdomain: '',
        domain: '',
        tld: '',
        port: '8080',
        path: '',
      },
    ],
  },
]

const urlWithAuth = [
  {
    number: 'AUTH-001',
    name: 'MongoDB connection URI',
    input: 'Connect using mongodb://user:pass@localhost:27017/mydb.',
    options: { webOnly: false },
    expected: ['mongodb://user:pass@localhost:27017/mydb'],
  },
  {
    number: 'AUTH-002',
    name: 'FTP URL with credentials',
    input: 'Download files from ftp://user:pass@ftp.example.com/pub/file.txt.',
    options: { webOnly: false, needParts: true },
    expected: [
      {
        url: 'ftp://user:pass@ftp.example.com/pub/file.txt',
        protocol: 'ftp://',
        auth: 'user:pass',
        ip: '',
        subdomain: 'ftp',
        domain: 'example.com',
        tld: 'com',
        port: '',
        path: '/pub/file.txt',
      },
    ],
  },
]

// Run tests and capture results
const runTestcases = async () => {
  const testCases = [...defaultCondition, ...withoutProtocol, ...urlParts, ...urlWithAuth]
  const testResults = []
  let passedCount = 0
  testCases.forEach((test) => {
    // if(test.number === 'PRT-002')         // To run a specific test case
    try {
      const result = urlex(test.input, test.options)
      assert.deepStrictEqual(result, test.expected)
      testResults.push({
        'Test Case No.': test.number,
        'Test Case': test.name,
        Status: '✅',
      })
      passedCount++
    } catch (error) {
      testResults.push({
        'Test Case No.': test.number,
        'Test Case': test.name,
        Status: '❌',
      })
    }
  })

  // Print the results in a table format
  console.table(testResults)
  console.log(`${passedCount} out of ${testCases.length} tests passed.`)
}

runTestcases()
