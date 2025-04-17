// Since the browser does not supprt byte buffers, we use Uint8Array instead
// "bytes" refers to Uint8Array in this file
// CryptoJS uses WordArray, so we need to convert between that as well
// All of the inputs are converted to bytes, then converted to the desired output
// For CryptoJS, we convert the bytes to WordArray, then convert the WordArray to the desired output


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
    const bytes = new Uint8Array(octal.length / 3)
    for (let i = 0; i < octal.length; i += 3) {
        bytes[i / 3] = parseInt(octal.substr(i, 3), 8)
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
    const bints = btext.split(' ')
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

    for (let char of base32) {
        if (char === '=') break
        const value = base32EncodingAlphabet.indexOf(char)
        if (value === -1) continue

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
    const text = htmlentities.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec)
    })
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
function decimalToBytes(bigint) {
    const hex = BigInt(bigint).toString(16)
    return hexToBytes(hex)
}
function bytesToDecimal(bytes) {
    let hex = ''
    for (let i = 0; i < bytes.length; i++) {
        hex += ('0' + bytes[i].toString(16)).slice(-2)
    }
    return BigInt('0x' + hex).toString()
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
function hexdumpToBytes(hexdump) {
    const lines = hexdump.split('\n')
    const bytes = []

    for (const line of lines) {
        const parts = line.trim().split(' ')
        if (parts.length < 2) continue // Skip empty or malformed lines

        // Skip the offset part
        for (let i = 1; i < parts.length - 1; i++) {
            const byte = parseInt(parts[i], 16)
            if (!isNaN(byte)) {
                bytes.push(byte)
            }
        }
    }

    return new Uint8Array(bytes)
}


// IPv4 Address <=> Bytes
function ipv4ToBytes(ipv4) {
    const parts = ipv4.split('.')
    const bytes = new Uint8Array(4)
    for (let i = 0; i < 4; i++) {
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

    // Total number of segments should be 8
    const missingCount = 8 - (head.length + tail.length)

    if (parts.length > 2 || missingCount < 0) {
        throw new Error('Invalid IPv6 address')
    }

    const zeros = new Array(missingCount).fill('0000');
    const full = [...head, ...zeros, ...tail].map(seg =>
        seg.padStart(4, '0')
    );

    if (missingCount < 0) {
        return new Uint8Array(0)
    }

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
    const cleaned = input.replace(/\s+/g, '').replace(/z/g, '!!!!!'); // handle 'z' shorthand
    const output = [];
  
    for (let i = 0; i < cleaned.length; i += 5) {
      const chunk = cleaned.slice(i, i + 5);
      let value = 0;
  
      // Pad short chunks with 'u' (ASCII 117, value 84)
      const paddedLength = chunk.length;
      const paddedChunk = chunk.padEnd(5, 'u');
  
      for (let j = 0; j < 5; j++) {
        const code = paddedChunk.charCodeAt(j);
        if (code < 33 || code > 117) {
          throw new Error(`Invalid character in ASCII85 block: ${paddedChunk[j]}`);
        }
        value = value * 85 + (code - 33);
      }
  
      // Extract 4 bytes
      const bytes = [
        (value >>> 24) & 0xFF,
        (value >>> 16) & 0xFF,
        (value >>> 8) & 0xFF,
        value & 0xFF,
      ];
  
      // Push only relevant bytes if it was padded
      output.push(...bytes.slice(0, paddedLength - 1));
    }
  
    return new Uint8Array(output);
  }
  
function bytesToAscii85(bytes) {
    const result = [];
    const length = bytes.length;
    let i = 0;
  
    while (i < length) {
      // Get up to 4 bytes (pad with 0s if fewer than 4)
      let chunk = 0;
      const remaining = Math.min(4, length - i);
      for (let j = 0; j < 4; j++) {
        chunk <<= 8;
        chunk |= (i + j < length) ? bytes[i + j] : 0;
      }
  
      if (chunk === 0 && remaining === 4) {
        result.push('z'); // compression shortcut for 0
      } else {
        const chars = new Array(5);
        for (let k = 4; k >= 0; k--) {
          chars[k] = String.fromCharCode((chunk % 85) + 33);
          chunk = Math.floor(chunk / 85);
        }
        result.push(...chars.slice(0, Math.ceil((remaining + 1) * 5 / 4)));
      }
  
      i += 4;
    }
  
    return result.join('')
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

function bytesToPbkdf2(bytes) {
    const salt = new Uint8Array(16)
    window.crypto.getRandomValues(salt)
    const keySize = 256
    const iterations = 350000
    const digest = CryptoJS.PBKDF2(
        bytesToWordarray(bytes),
        bytesToWordarray(salt),
        { keySize: keySize / 32, iterations: iterations }
    ).toString()
    return `pbkdf2$sha256$${iterations}$${bytesToHex(salt)}$${digest}`
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