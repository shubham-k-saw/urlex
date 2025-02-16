// ---------- Hostname/TLD Validation Section ----------
import fs from 'fs'

// Load TLD data (a mapping of TLD strings to their levels)
const loadJSON = (filePath) => JSON.parse(fs.readFileSync(new URL(filePath, import.meta.url), 'utf8'))
const tlds = loadJSON('./tlds.json')

const parseHostname = (hostname, options = {}) => {
  const allowDotlessTLD = options.allowDotlessTLD ?? false
  const parts = hostname.split('.')
  let tldLevel = -1 // Indicates that no valid TLD has been found yet.
  let stack = ''

  // Iterate from right to left to build the TLD string.
  for (let i = parts.length - 1; i >= 0; i--) {
    // Build the current domain stack in lower-case.
    stack = parts[i].toLowerCase() + (stack ? `.${stack}` : '')
    if (tlds[stack] !== undefined) {
      tldLevel = tlds[stack]
    }
  }

  // Validate TLD: either a valid tldLevel was found and there are enough parts,
  // or if allowDotlessTLD is true then the hostname can match the TLD exactly.
  if (tldLevel === -1 || parts.length <= tldLevel) {
    if (!(allowDotlessTLD && parts.length === tldLevel)) {
      return { tld: '', domain: '', sub: '' }
    }
  }

  return {
    tld: parts.slice(-tldLevel).join('.'),
    domain: parts.slice(-tldLevel - 1).join('.'),
    sub: parts.slice(0, -tldLevel - 1).join('.'),
  }
}

// ---------- IP Address Regular Expressions Section ----------
const ipv4 = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}'

const v6segment = '[a-fA-F\\d]{1,4}'

const v6 = `
(?:
(?:${v6segment}:){7}(?:${v6segment}|:)|                                          // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8
(?:${v6segment}:){6}(?:${ipv4}|:${v6segment}|:)|                                 // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4
(?:${v6segment}:){5}(?::${ipv4}|(?::${v6segment}){1,2}|:)|                       // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4
(?:${v6segment}:){4}(?:(?::${v6segment}){0,1}:${ipv4}|(?::${v6segment}){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4
(?:${v6segment}:){3}(?:(?::${v6segment}){0,2}:${ipv4}|(?::${v6segment}){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4
(?:${v6segment}:){2}(?:(?::${v6segment}){0,3}:${ipv4}|(?::${v6segment}){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4
(?:${v6segment}:){1}(?:(?::${v6segment}){0,4}:${ipv4}|(?::${v6segment}){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4
(?::(?:(?::${v6segment}){0,5}:${ipv4}|(?::${v6segment}){1,7}|:))                 // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4
)(?:%[0-9a-zA-Z]{1,})?                                                           // %eth0            %1
`.replace(/\s*\/\/.*$/gm, '').replace(/\n/g, '').trim()

const ipv6 = `\\[${v6}\\]`

// ---------- URL Extraction Function Section ----------
const urlex = (text, config = {}) => {
  const urls = []

  // Merge default options with any provided configuration.
  const options = {
    needParts: false,         // Does not return detailed URL parts by default.
    withProtocol: true,       // Do not require a protocol by default.
    webOnly: true,            // Restrict to web protocols (http/https) by default.
    authCreds: true,          // Support authentication credentials.
    ipSupport: 'full',        // Support both IPv4 and IPv6 addresses by default.    Acceptable values: 'full', 'ipv4', 'none'
    allowDotlessTLD: false,   // Do not allow url without domain by default
    ...config,
  }

  const protocol = options.webOnly ? `(?:(?:https?:\\/\\/))?` : `(?:(?:[a-z]+:)(?:\\/\\/)?)?`
  const auth = options.authCreds ? '(?:\\S+(?::\\S*)?@)?' : ''
  const ip = options.ipSupport === 'none' ? '' : options.ipSupport === 'ipv4' ? `|(?:${ipv4})` : `|(?:${ipv4}|${ipv6})`
  const host = `(?:(?:[a-z\\u00a1-\\uffff0-9](?:[a-z\\u00a1-\\uffff0-9_-]*[a-z\\u00a1-\\uffff0-9])?\\.)*)`
  const domain = `(?:[a-z\\u00a1-\\uffff0-9](?:[a-z\\u00a1-\\uffff0-9-]*[a-z\\u00a1-\\uffff0-9])?)`
  const tld = `(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))`
  const hostname = `${host}${domain}${tld}`
  const port = '(?::(?:6553[0-5]|655[0-2]\\d|65[0-4]\\d{2}|6[0-4]\\d{3}|[1-5]\\d{4}|[1-9]\\d{0,3}|0))?'
  const path = '(?:[/?#][^\\s"]*)?'
  // Excluded trailing symbols from URLs: ",", ".", "!", ")", "]", "}", "\", ">"
  const dontCaptureTrailingPunctuation = '(?<![\\,\\!\\.\\)\\]\\}\\\\\\>])'

  const regex = `(${protocol})(${auth})(?:(localhost${ip})|(${hostname}))(${port})(${path})${dontCaptureTrailingPunctuation}`
  const urlRegex = new RegExp(regex, 'ig')

  // Iterate over all URL matches found in the provided text.
  for (const match of text.matchAll(urlRegex)) {
    // Skip any match that is immediately preceded by an '@' (to avoid matching email addresses).
    const matchStart = match.index
    if (matchStart > 0 && text[matchStart - 1] === '@') {
      continue
    }

    // Destructure the match groups. Use default empty strings if a group is missing.
    const [fullUrl = '', protocol = '', auth = '', ip = '', hostname = '', port = '', path = ''] = match

    // Clean the extracted port and authentication credentials:
    const cleanPort = port.startsWith(':') ? port.slice(1) : port
    const cleanAuth = auth.endsWith('@') ? auth.slice(0, -1) : auth

    // Build an object to store the detected URL components.
    const detected = {
      url: fullUrl,
      protocol,
      auth: cleanAuth,
      ip,
      subdomain: '',
      domain: '',
      tld: '',
      port: cleanPort,
      path,
    }

    // Helper function to add the detected URL to the results.
    // If detailed parts are requested, push the full object; otherwise, push just the URL string.
    const pushDetectedUrl = () => {
      if (options.needParts) {
        urls.push(detected)
      } else {
        urls.push(detected.url)
      }
    }

    if (hostname) {
      // Process the hostname case (non-IP URLs)
      const { sub, domain, tld } = parseHostname(hostname, options)
      detected.subdomain = sub
      detected.domain = domain
      detected.tld = tld

      if (options.withProtocol) {
        // If only URLs with protocols should be considered, apply extra validation. Accept the URL if:
        // - It has a protocol and a valid TLD, or
        // - The subdomain includes 'www'.
        if ((protocol && detected.tld) || (detected.subdomain && detected.subdomain.toLowerCase().includes('www'))) {
          pushDetectedUrl()
        }
      } else if (detected.tld) {
        // For URLs without a required protocol, ensure that there is a valid TLD.
        // Also, if there is authentication info, a protocol must be present.
        if (!detected.protocol && detected.auth) continue
        pushDetectedUrl()
      }
    } else {
      // Process the IP address or localhost case.
      if (options.withProtocol) {
        if (protocol) pushDetectedUrl()
      } else {
        pushDetectedUrl()
      }
    }
  }

  return urls
}

export default urlex
