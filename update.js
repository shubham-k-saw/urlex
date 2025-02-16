import fs from 'fs'
import https from 'https'

// Fetch latest TLD list from Mozilla's Public Suffix List (https://publicsuffix.org)
const REMOTE_TLD_URL = 'https://publicsuffix.org/list/effective_tld_names.dat'
const TLD_CACHE_JSON = 'tlds.json'

const fetchRemoteTldFile = async () => {
  return new Promise((resolve, reject) => {
    https
      .get(REMOTE_TLD_URL, (res) => {
        if (res.statusCode !== 200) {
          res.resume() // Discard any remaining data.
          return reject(new Error(`Failed to fetch file. Status code: ${res.statusCode}`))
        }
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => resolve(data))
      })
      .on('error', reject)
  })
}

const parseIcann = (content) => {
  // Regex patterns for parsing.
  const sectionRegex = /^\/\/\s*===BEGIN (ICANN|PRIVATE) DOMAINS===\s*$/
  const commentRegex = /^\/\/.*?/
  const splitterRegex = /(\!|\*\.)?(.+)/

  let currentSection = null
  const icannTlds = {}
  const lines = content.split(/\r?\n/)

  for (let line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Check for section header.
    const sectionMatch = sectionRegex.exec(trimmed)
    if (sectionMatch) {
      currentSection = sectionMatch[1].toLowerCase()
      continue
    }

    // Skip comment lines.
    if (commentRegex.test(trimmed)) continue

    // Only process lines within the ICANN section.
    if (currentSection !== 'icann') continue

    const match = splitterRegex.exec(trimmed)
    if (!match) continue

    const tld = match[2]
    let level = tld.split('.').length
    const modifier = match[1]

    if (modifier === '*.') level++
    if (modifier === '!') level--

    icannTlds[tld] = level
  }

  if (Object.keys(icannTlds).length === 0) {
    throw new Error('No ICANN domains were found in the fetched data.')
  }

  return icannTlds
}

const updateTldList = async () => {
  try {
    console.log('Fetching TLD file from remote URL...')
    const content = await fetchRemoteTldFile()

    console.log('Parsing ICANN TLDs...')
    const icannTlds = parseIcann(content)

    await fs.promises.writeFile(new URL(TLD_CACHE_JSON, import.meta.url), JSON.stringify(icannTlds, null, 2))
    console.log('TLD List Updated and saved to', TLD_CACHE_JSON)
  } catch (error) {
    console.error('Error updating TLD list:', error)
  }
}

export default updateTldList
