// Since the browser does not supprt byte buffers, we use Uint8Array instead
// "bytes" refers to Uint8Array in this file
// CryptoJS uses WordArray, so we need to convert between that as well
// All of the inputs are converted to bytes, then converted to the desired output
// For CryptoJS, we convert the bytes to WordArray, then convert the WordArray to the desired output


// Text <=> Bytes
function utf16leToBytes(text) {
    const bytes = []
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i)
        bytes.push(code & 0xFF)        // low byte
        bytes.push((code >> 8) & 0xFF) // high byte
    }
    return bytes
}

function bytesToUtf16le(u8array) {
    let str = ''
    for (let i = 0; i < u8array.length; i += 2) {
        const low  = u8array[i]
        const high = u8array[i + 1]
        str += String.fromCharCode((high << 8) | low)
    }
    return str
}

// WordArray (CryptoJS) <=> Bytes
function wordarrayToBytes(wordArray) {
    const words = wordArray.words
    const sigBytes = wordArray.sigBytes
    const bytes = []

    for (let i = 0; i < sigBytes; i++) {
        const word = words[Math.floor(i / 4)]
        const byte = (word >> (24 - (i % 4) * 8)) & 0xFF
        bytes.push(byte)
    }

    return bytes
}
function bytesToWordarray(u8Array) {
    const words = []
    for (let i = 0; i < u8Array.length; i += 4) {
        words.push(
            ((u8Array[i]     || 0) << 24) |
            ((u8Array[i + 1] || 0) << 16) |
            ((u8Array[i + 2] || 0) << 8)  |
            ((u8Array[i + 3] || 0))
        )
    }
    return CryptoJS.lib.WordArray.create(words, u8Array.length)
}


// Hex <=> Bytes
function hexToBytes(hex) {
    if (!/^([0-9a-fA-F]{2})*$/.test(hex)) {
        throw new Error('Invalid hex string')
    }
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes
}
function bytesToHex(bytes) {
    let hex = ''
    for (let i = 0; i < bytes.length; i++) {
        hex += ('0' + bytes[i].toString(16)).slice(-2)
    }
    return hex
}


// Octal <=> Bytes
function octalToBytes(octal) {
    if (!/^([0-7]{3})*$/.test(octal)) {
        throw new Error('Invalid octal string')
    }
    const bytes = new Uint8Array(octal.length / 3)
    for (let i = 0; i < octal.length; i += 3) {
        const value = parseInt(octal.substr(i, 3), 8)
        if (value > 255) {
            throw new Error('Octal value out of byte range: ' + octal.substr(i, 3))
        }
        bytes[i / 3] = value
    }
    return bytes
}
function bytesToOctal(bytes) {
    let octal = ''
    for (let i = 0; i < bytes.length; i++) {
        octal += ('000' + bytes[i].toString(8)).slice(-3)
    }
    return octal
}


// Byte Array (text) <=> bytes
function btextToBytes(btext) {
    btext = btext.trim()
    if (btext === '') {
        return new Uint8Array(0)
    }
    const bints = btext.split(/\s+/)
    const bytes = new Uint8Array(bints.length)
    for (let i = 0; i < bints.length; i++) {
        bytes[i] = parseInt(bints[i], 10)
    }
    return bytes
}
function bytesToBtext(bytes) {
    return Array.from(bytes).join(' ')
}


// Base32 <=> Bytes
const base32EncodingAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function base32ToBytes(base32) {
    const bytes = []
    let buffer = 0
    let bitsLeft = 0

    base32 = base32.toUpperCase()
    if (!/^[A-Z2-7]*=*$/.test(base32)) {
        throw new Error('Invalid Base32 string')
    }

    for (let char of base32) {
        if (char === '=') break
        const value = base32EncodingAlphabet.indexOf(char)

        buffer = (buffer << 5) | value
        bitsLeft += 5

        while (bitsLeft >= 8) {
            bytes.push((buffer >> (bitsLeft - 8)) & 0xFF)
            bitsLeft -= 8
        }
    }

    return new Uint8Array(bytes)
}
function bytesToBase32(bytes) {
    
    let base32 = ''
    let buffer = 0
    let bitsLeft = 0
    
    for (let byte of bytes) {
        buffer = (buffer << 8) | byte
        bitsLeft += 8

        while (bitsLeft >= 5) {
            base32 += base32EncodingAlphabet[(buffer >> (bitsLeft - 5)) & 0x1F]
            bitsLeft -= 5
        }
    }

    if (bitsLeft > 0) {
        base32 += base32EncodingAlphabet[(buffer << (5 - bitsLeft)) & 0x1F]
    }

    while (base32.length % 8 !== 0) {
        base32 += '='
    }

    return base32
}


// HTML Entities <=> Bytes
function htmlentitiesToBytes(htmlentities) {
    // Decode named (&amp;), decimal (&#65;) and hex (&#x41;) entities.
    // A detached <textarea> parses its content as text, so no markup is created or executed.
    const decoder = document.createElement('textarea')
    decoder.innerHTML = htmlentities
    const text = decoder.value
    const bytes = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i)
    }
    return bytes
}
function bytesToHtmlentities(bytes) {
    const text = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
    return text.replace(/[\u00A0-\u9999<>&"']/gim, function(char) {
        return `&#${char.charCodeAt(0)};`
    })
}


// Base64 <=> Bytes
function base64ToBytes(base64) {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
}
function bytesToBase64(bytes) {
    let binaryString = ''
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i])
    }
    return btoa(binaryString)
}


// Base64 <=> Base64URL
function b64ToB64Url(base64) {
    return base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}
function b64UrlToB64(base64url) {
    return base64url.replace(/-/g, '+').replace(/_/g, '/')
}


// Binary (text) <=> Bytes
function binaryToBytes(binary) {
    binary = binary.replace(/\s+/g, '') // Remove all spaces
    let length = binary.length - (binary.length % 8) // Ignore extra bits at the end

    const bytes = new Uint8Array(length / 8)
    for (let i = 0; i < length; i += 8) {
        bytes[i / 8] = parseInt(binary.substr(i, 8), 2)
    }
    return bytes
}
function bytesToBinary(bytes) {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
        binary += bytes[i].toString(2).padStart(8, '0')
    }
    return binary
}

// Big int (text) <=> Bytes
function decimalToBytes(decimal) {
    decimal = decimal.trim()
    if (decimal === '') {
        return new Uint8Array(0)
    }
    if (!/^\d+$/.test(decimal)) {
        throw new Error('Invalid decimal number')
    }
    let hex = BigInt(decimal).toString(16)
    if (hex.length % 2 !== 0) {
        hex = '0' + hex // Pad to whole bytes
    }
    return hexToBytes(hex)
}
function bytesToDecimal(bytes) {
    if (bytes.length === 0) {
        return ''
    }
    return BigInt('0x' + bytesToHex(bytes)).toString()
}


// Hexdump <=> Bytes
function bytesToHexDump(bytes) {
    const lineSize = 16
    let hexDump = ''

    for (let i = 0; i < bytes.length; i += lineSize) {
        const offset = i.toString(16).padStart(8, '0') // Offset in hex
        const lineBytes = bytes.slice(i, i + lineSize)
        const hexPart = Array.from(lineBytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join(' ')
        const asciiPart = Array.from(lineBytes)
            .map(byte => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.'))
            .join('')

        hexDump += `${offset}  ${hexPart.padEnd(lineSize * 3)} ${asciiPart}\n`
    }

    return hexDump.trim()
}
// Parses whitespace-separated hex tokens ("de", "dead", ...) into bytes, or returns null if any token is invalid
function parseHexdumpTokens(region) {
    const bytes = []
    for (const token of region.trim().split(/\s+/)) {
        if (token === '') continue
        if (!/^([0-9a-fA-F]{2})+$/.test(token)) {
            return null
        }
        for (let i = 0; i < token.length; i += 2) {
            bytes.push(parseInt(token.substr(i, 2), 16))
        }
    }
    return bytes
}
// Supports this tool's own format, `xxd` ("00000000: 6865 6c6c  hell") and `hexdump -C` ("00000000  68 65  |he|")
function hexdumpToBytes(hexdump) {
    const bytes = []

    for (let line of hexdump.split(/\r?\n/)) {
        line = line.trim()
        if (line === '') continue

        const match = line.match(/^[0-9a-fA-F]+:?(?:\s+(.*))?$/)
        if (!match) {
            throw new Error('Invalid hex dump line: ' + line)
        }
        const rest = match[1] || ''

        // hexdump -C style: ASCII column wrapped in |...| with one character per byte
        const bar = rest.indexOf('|')
        if (bar !== -1 && bar < rest.length - 1 && rest.endsWith('|')) {
            const lineBytes = parseHexdumpTokens(rest.slice(0, bar))
            if (lineBytes !== null && lineBytes.length === rest.length - bar - 2) {
                bytes.push(...lineBytes)
                continue
            }
        }

        // Otherwise the ASCII column is separated from the hex column by at least two spaces
        const lineBytes = parseHexdumpTokens(rest.split(/\s{2,}/)[0])
        if (lineBytes === null) {
            throw new Error('Invalid hex dump line: ' + line)
        }
        bytes.push(...lineBytes)
    }

    return new Uint8Array(bytes)
}


// IPv4 Address <=> Bytes
function ipv4ToBytes(ipv4) {
    const parts = ipv4.split('.')
    if (parts.length !== 4) {
        throw new Error('Invalid IPv4 address')
    }
    const bytes = new Uint8Array(4)
    for (let i = 0; i < 4; i++) {
        if (!/^\d{1,3}$/.test(parts[i]) || parseInt(parts[i], 10) > 255) {
            throw new Error('Invalid IPv4 address')
        }
        bytes[i] = parseInt(parts[i], 10)
    }
    return bytes
}
function bytesToIpv4(bytes) {
    if (bytes.length !== 4) {
        return 'Invalid IPv4 length! 4 bytes required. Current: ' + bytes.length
    }
    return Array.from(bytes).join('.')
}


// IPv6 Address <=> Bytes
/**
 * @param {string} ipv6
 * @returns {Uint8Array}
 */
function ipv6ToBytes(ipv6) {
    // Uncompress IPv6 address from '::' format
    const parts = ipv6.split('::')

    let head = parts[0] ? parts[0].split(':') : []
    let tail = parts[1] ? parts[1].split(':') : []

    if (parts.length > 2) {
        throw new Error('Invalid IPv6 address')
    }

    // Total number of segments should be 8; '::' must stand for at least one zero segment
    const missingCount = 8 - (head.length + tail.length)
    if (parts.length === 1 ? missingCount !== 0 : missingCount < 1) {
        throw new Error('Invalid IPv6 address')
    }
    for (const seg of [...head, ...tail]) {
        if (!/^[0-9a-fA-F]{1,4}$/.test(seg)) {
            throw new Error('Invalid IPv6 address')
        }
    }

    const zeros = new Array(missingCount).fill('0000');
    const full = [...head, ...zeros, ...tail].map(seg =>
        seg.padStart(4, '0')
    );

    // Convert each segment to bytes
    const bytes = new Uint8Array(16)

    for (let i = 0; i < 8; i++) {
        bytes[i * 2] = parseInt(full[i], 16) >> 8
        bytes[i * 2 + 1] = parseInt(full[i], 16) & 0xFF
    }
    return bytes
}
function bytesToIpv6(bytes) {
    if (bytes.length !== 16) {
        return 'Invalid IPv6 length! 16 bytes required. Current: ' + bytes.length
    }

    // Convert bytes to hex segments
    let ipv6 = ''
    for (let i = 0; i < 8; i++) {
        const byte1 = bytes[i * 2].toString(16).padStart(2, '0')
        const byte2 = bytes[i * 2 + 1].toString(16).padStart(2, '0')
        ipv6 += byte1 + byte2 + ':'
    }
    ipv6 = ipv6.slice(0, -1)


    // Compress address
    const segments = ipv6.split(':').map(seg => seg.replace(/^0+/, '') || '0');

    let bestStart = -1;
    let bestLength = 0;
  
    let currentStart = -1;
    let currentLength = 0;
  
    for (let i = 0; i < segments.length; i++) {
      if (segments[i] === '0') {
        if (currentStart === -1) currentStart = i;
        currentLength++;
      } else {
        if (currentLength > bestLength) {
          bestStart = currentStart;
          bestLength = currentLength;
        }
        currentStart = -1;
        currentLength = 0;
      }
    }
  
    // Final check at end
    if (currentLength > bestLength) {
        bestStart = currentStart
        bestLength = currentLength
    }
  
    // If we found a compressible zero sequence
    if (bestLength > 1) {
      segments.splice(bestStart, bestLength, '');
      if (bestStart === 0) segments.unshift(''); // Leading ::
      if (bestStart + bestLength === 8) segments.push(''); // Trailing ::
    }
  
    return segments.join(':').replace(/:{3,}/, '::'); // Ensure "::" not more than once
}


// ISO 8601 Time <=> Bytes
function iso8601ToBytes(iso8601) {
    const date = new Date(iso8601)
    if (isNaN(date.getTime())) {
        throw new Error('Invalid ISO 8601 date string')
    }
    return new Uint8Array(date.getTime().toString().split('').map(Number))
}
function bytesToIso8601(bytes) {
    const timestamp = bytes.reduce((acc, byte) => acc + byte, '')
    const date = new Date(Number(timestamp))
    return date.toISOString()
}


// Ascii85 <=> Bytes
function ascii85ToBytes(input) {
    let cleaned = input.replace(/\s+/g, '')
    // Optional Adobe-style delimiters
    if (cleaned.startsWith('<~')) cleaned = cleaned.slice(2)
    if (cleaned.endsWith('~>')) cleaned = cleaned.slice(0, -2)

    const output = []
    let i = 0
    while (i < cleaned.length) {
        // 'z' is shorthand for a group of four zero bytes (only valid at a group boundary)
        if (cleaned[i] === 'z') {
            output.push(0, 0, 0, 0)
            i++
            continue
        }

        const chunk = cleaned.slice(i, i + 5)
        if (chunk.includes('z')) {
            throw new Error('Invalid ASCII85: "z" inside a group')
        }
        if (chunk.length === 1) {
            throw new Error('Invalid ASCII85: dangling final character')
        }

        // Pad short chunks with 'u' (ASCII 117, value 84)
        const paddedChunk = chunk.padEnd(5, 'u')
        let value = 0
        for (let j = 0; j < 5; j++) {
            const code = paddedChunk.charCodeAt(j)
            if (code < 33 || code > 117) {
                throw new Error(`Invalid character in ASCII85 block: ${paddedChunk[j]}`)
            }
            value = value * 85 + (code - 33)
        }
        if (value > 0xFFFFFFFF) {
            throw new Error('Invalid ASCII85: group value overflow')
        }

        const bytes = [
            (value >>> 24) & 0xFF,
            (value >>> 16) & 0xFF,
            (value >>> 8) & 0xFF,
            value & 0xFF,
        ]
        // A group of n characters encodes n - 1 bytes
        output.push(...bytes.slice(0, chunk.length - 1))
        i += 5
    }

    return new Uint8Array(output)
}

function bytesToAscii85(bytes) {
    let result = ''

    for (let i = 0; i < bytes.length; i += 4) {
        const remaining = Math.min(4, bytes.length - i)

        // Build the 32-bit group arithmetically (bit shifts overflow into negative int32)
        let chunk = 0
        for (let j = 0; j < 4; j++) {
            chunk = chunk * 256 + (j < remaining ? bytes[i + j] : 0)
        }

        if (chunk === 0 && remaining === 4) {
            result += 'z' // compression shortcut for 0
            continue
        }

        const chars = new Array(5)
        for (let k = 4; k >= 0; k--) {
            chars[k] = String.fromCharCode((chunk % 85) + 33)
            chunk = Math.floor(chunk / 85)
        }
        // n input bytes produce n + 1 output characters
        result += chars.slice(0, remaining + 1).join('')
    }

    return result
}
  


// Bytes => Hashes
function bytesToMd5(bytes) {
    return CryptoJS.MD5(bytesToWordarray(bytes)).toString()
}

function bytesToSha1(bytes) {
    return CryptoJS.SHA1(bytesToWordarray(bytes)).toString()
}

function bytesToSha256(bytes) {
    return CryptoJS.SHA256(bytesToWordarray(bytes)).toString()
}

function bytesToSha512(bytes) {
    return CryptoJS.SHA512(bytesToWordarray(bytes)).toString()
}

// Uses WebCrypto with HMAC-SHA256 (CryptoJS 4.1.1 silently used SHA1 here).
// WebCrypto runs off the main thread, so the UI no longer freezes. Returns a Promise; the app awaits it.
async function bytesToPbkdf2(bytes) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const keySize = 256
    const iterations = 350000
    const key = await crypto.subtle.importKey('raw', new Uint8Array(bytes), 'PBKDF2', false, ['deriveBits'])
    const digest = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations },
        key,
        keySize
    )
    return `pbkdf2$sha256$${iterations}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(digest))}`
}


// ROT13 <=> Bytes
function rot13ToBytes(rot13) {
    return new Uint8Array(rot13.split('').map(char => {
        if (char >= 'A' && char <= 'Z') {
            return ((char.charCodeAt(0) - 'A'.charCodeAt(0) - 13 + 26) % 26) + 'A'.charCodeAt(0)
        } else if (char >= 'a' && char <= 'z') {
            return ((char.charCodeAt(0) - 'a'.charCodeAt(0) - 13 + 26) % 26) + 'a'.charCodeAt(0)
        }
        return char.charCodeAt(0)
    }))
}
function bytesToRot13(bytes) {
    return String.fromCharCode(...bytes.map(byte => {
        if (byte >= 'A'.charCodeAt(0) && byte <= 'Z'.charCodeAt(0)) {
            return ((byte - 'A'.charCodeAt(0) + 13) % 26) + 'A'.charCodeAt(0)
        } else if (byte >= 'a'.charCodeAt(0) && byte <= 'z'.charCodeAt(0)) {
            return ((byte - 'a'.charCodeAt(0) + 13) % 26) + 'a'.charCodeAt(0)
        }
        return byte
    }))
}

// Text <=> Morse
morseAlphabet = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': '/'
}

function textToMorse(text) {
    return text.toUpperCase().split('').map(char => morseAlphabet[char] || '').join(' ')
}
function morseToText(morse) {
    morse = morse.trim()
    if (morse === '') {
        return ''
    }
    const morseToChar = Object.fromEntries(Object.entries(morseAlphabet).map(([k, v]) => [v, k]))
    return morse.split(/\s+/).map(code => morseToChar[code] || ' ').join('')
}


// Bytes => CRC32
function bytesToCrc32(bytes) {
    const table = new Uint32Array(256)

    // Generate the CRC32 table
    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1)
      }
      table[i] = crc >>> 0;
    }
  
    // Compute the CRC
    let crc = 0xFFFFFFFF
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]
      const index = (crc ^ byte) & 0xFF
      crc = (crc >>> 8) ^ table[index]
    }
  
    // Final XOR and return as zero-padded hex string
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0')
}

// JWT => Bytes (decoding only: the signature is NOT verified)
// Produces pretty-printed JSON text with the decoded header, payload and the raw signature,
// plus human-readable dates for the registered time claims (iat, nbf, exp).
function jwtSegmentToJson(segment, name) {
    if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
        throw new Error(`Invalid JWT ${name}: not Base64 URL`)
    }
    const text = new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(b64UrlToB64(segment)))
    const json = JSON.parse(text)
    if (json === null || typeof json !== 'object' || Array.isArray(json)) {
        throw new Error(`Invalid JWT ${name}: not a JSON object`)
    }
    return json
}

function decodeJwt(token) {
    token = token.trim().replace(/^Bearer\s+/i, '')
    const parts = token.split('.')
    if (parts.length === 5) {
        throw new Error('Encrypted JWTs (JWE) cannot be decoded without the key')
    }
    if (parts.length !== 3) {
        throw new Error('Invalid JWT: expected 3 dot-separated parts')
    }
    const [headerPart, payloadPart, signaturePart] = parts
    if (signaturePart !== '' && !/^[A-Za-z0-9_-]+$/.test(signaturePart)) {
        throw new Error('Invalid JWT signature: not Base64 URL')
    }

    const result = {
        header: jwtSegmentToJson(headerPart, 'header'),
        payload: jwtSegmentToJson(payloadPart, 'payload'),
        signature: signaturePart,
    }

    // Human-readable versions of the NumericDate claims (seconds since the epoch)
    const now = Date.now() / 1000
    const dates = {}
    for (const claim of ['iat', 'nbf', 'exp']) {
        const value = result.payload[claim]
        if (typeof value !== 'number' || !isFinite(value)) continue
        const date = new Date(value * 1000)
        if (isNaN(date.getTime())) continue
        let note = ''
        if (claim === 'exp') note = value < now ? ' (expired)' : ' (valid)'
        if (claim === 'nbf' && value > now) note = ' (not yet valid)'
        dates[claim] = date.toISOString() + note
    }
    if (Object.keys(dates).length > 0) {
        result.dates = dates
    }

    return result
}

function jwtToBytes(token) {
    return new TextEncoder().encode(JSON.stringify(decodeJwt(token), null, 2))
}
