// Format registry: every input (fromFormats) and output (toFormats) format, their sidebar options
// and the options resolver. Pure data + converters, no DOM access, so it can be unit tested.
import {
    OptionError, utf16ToBytes, bytesToUtf16, hexToBytes, bytesToHex, octalToBytes, bytesToOctal, btextToBytes, bytesToBtext, base32ToBytes, bytesToBase32, htmlentitiesToBytes, bytesToHtmlentities, base64ToBytes, bytesToBase64, formatBase64, b64ToB64Url, b64UrlToB64, binaryToBytes, bytesToBinary, decimalToBytes, bytesToDecimal, bytesToHexDump, hexdumpToBytes, ipv4ToBytes, bytesToIpv4, ipv6ToBytes, bytesToIpv6, iso8601ToBytes, bytesToIso8601, ascii85ToBytes, bytesToAscii85, bytesToMd5, bytesToSha1, bytesToSha256, bytesToSha512, bytesToHmac, bytesToPbkdf2, caesarShift, countText, reverseText, textToMorse, morseToText, bytesToCrc32, decodeJwt, jwtToBytes,
} from './converters.js'


// Format options
// Each format can declare `options`: fields that are rendered in the sidebar under its format selector.
// The resolved values are passed to `convert(input, options)` (and to the input `validator(input, options)`).
// Option fields:
//   id        key in the options object and in the URL query (e.g. ?to=hmac&to.algorithm=SHA1)
//   label     text shown in the sidebar
//   type      'number' | 'text' | 'select' | 'checkbox'
//   default   default value (select values are strings)
//   min, max, step   limits for numbers (integers only)
//   choices   [[value, label], ...] for selects
//   secret    never written to the URL (keys, salts)
//   title     tooltip
const caesarOptions = [
    { id: 'shift', label: 'Shift', type: 'number', default: 13, min: -1000000, max: 1000000,
      title: 'How many positions each character is moved forward in the alphabet. ROT13 is a shift of 13. As an input format the shift is reversed, so the same settings decode the text.' },
    { id: 'alphabet', label: 'Alphabet', type: 'text', default: 'abcdefghijklmnopqrstuvwxyz',
      title: 'The characters to rotate, in order. The other-case version of a letter is rotated too and keeps its case. Characters not in the alphabet are left unchanged.' },
]
const decimalOptions = [
    { id: 'byteOrder', label: 'Byte Order', type: 'select', default: 'big',
      choices: [['big', 'Big Endian'], ['little', 'Little Endian']],
      title: 'Big endian: the first byte is the most significant. Little endian: the first byte is the least significant.' },
]
const utf16ByteOrderOption = { id: 'byteOrder', label: 'Byte Order', type: 'select', default: 'little',
    choices: [['little', 'Little Endian (LE)'], ['big', 'Big Endian (BE)']] }
const reverseOptions = [
    { id: 'by', label: 'Reverse By', type: 'select', default: 'characters',
      choices: [['characters', 'Characters'], ['words', 'Words'], ['lines', 'Lines']] },
]

export class OptionsResolver {
    // Returns the full options object for a format: raw values (from the sidebar or the URL) merged with defaults.
    // Throws OptionError for invalid values.
    static resolve(format, raw = {}) {
        const resolved = {}
        for (const option of (format && format.options) || []) {
            const value = option.id in raw ? raw[option.id] : option.default
            resolved[option.id] = OptionsResolver.parse(option, value)
        }
        return resolved
    }

    static parse(option, value) {
        switch (option.type) {
            case 'checkbox':
                return value === true || value === 'true'
            case 'number': {
                const number = Number(String(value).trim())
                if (String(value).trim() === '' || !Number.isInteger(number)
                    || (option.min !== undefined && number < option.min)
                    || (option.max !== undefined && number > option.max)) {
                    throw new OptionError(option.id, `${option.label} must be a whole number between ${option.min} and ${option.max}`)
                }
                return number
            }
            case 'select': {
                const value_ = String(value)
                if (!option.choices.some(([choice]) => choice === value_)) {
                    throw new OptionError(option.id, `Invalid ${option.label}: ${value_}`)
                }
                return value_
            }
            default:
                return String(value)
        }
    }
}


export const fromFormats = {
    'utf8': {
        'name': 'Text (UTF-8)',
        'validator': input => true,
        'convert': input => new TextEncoder().encode(input)
    },
    'utf16le': {
        'name': 'Text (UTF-16)',
        'options': [
            utf16ByteOrderOption,
            { id: 'bom', label: 'Add Byte Order Mark (BOM)', type: 'checkbox', default: false },
        ],
        'validator': input => true,
        'convert': (input, o) => utf16ToBytes(input, o.byteOrder === 'little', o.bom)
    },
    'hex': {
        'name': 'Hex',
        'validator': input => {
            try {
                hexToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => hexToBytes(input)
    },
    'octal': {
        'name': 'Octal',
        'validator': input => {
            try {
                octalToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => octalToBytes(input)
    },
    'base32': {
        'name': 'Base32',
        'validator': input => {
            try {
                base32ToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => base32ToBytes(input)
    },
    'base64': {
        'name': 'Base64',
        'validator': input => {
            try {
                atob(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => base64ToBytes(input)
    },
    'base64url': {
        'name': 'Base64 URL',
        'validator': input => {
            try {
                atob(b64UrlToB64(input))
                return true
            } catch {
                return false
            }
        },
        'convert': input => base64ToBytes(b64UrlToB64(input))
    },
    'url': {
        'name': 'URL Encoding',
        'validator': input => {
            try {
                decodeURIComponent(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => new TextEncoder().encode(decodeURIComponent(input))
    },
    'bytes': {
        'name': 'Byte Array',
        'validator': input => {
            try {
                btextToBytes(input) // Accepts spaces, commas and [brackets]
                return true
            } catch {
                return false
            }
        },
        'convert': input => btextToBytes(input)
    },
    'decimal': {
        'name': 'Decimal',
        'options': decimalOptions,
        'validator': input => {
            try {
                decimalToBytes(input)
                return true
            }
            catch {
                return false
            }
        },
        'convert': (input, o) => decimalToBytes(input, o.byteOrder === 'little')
    },
    'ascii85': {
        'name': 'ASCII 85',
        'validator': input => {
            try {
                ascii85ToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => ascii85ToBytes(input)
    },
    'htmlentities': {
        'name': 'HTML Entities',
        'validator': input => true, // It can be any text
        'convert': input => htmlentitiesToBytes(input)
    },
    'binary': {
        'name': 'Binary',
        'validator': input => /^[01\s]*$/.test(input),
        'convert': input => binaryToBytes(input)
    },
    'morse': {
        'name': 'Morse Code',
        'validator': input => /^[\s.\-\/]*$/.test(input), // '/' separates words
        'convert': input => new TextEncoder().encode(morseToText(input))
    },
    'uuid4': {
        'name': 'UUIDv4',
        'validator': input => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            return uuidRegex.test(input)
        },
        'convert': input => hexToBytes(input.replace(/-/g, ''))
    },
    'hexdump': {
        'name': 'Hex Dump',
        'validator': input => {
            try {
                hexdumpToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => hexdumpToBytes(input)
    },
    'ipv4': {
        'name': 'IPv4 Address',
        'validator': input => {
            try {
                ipv4ToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => ipv4ToBytes(input)
    },
    'ipv6': {
        'name': 'IPv6 Address',
        'validator': input => {
            try {
                ipv6ToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => ipv6ToBytes(input)
    },
    'iso8601': {
        'name': 'ISO 8601 Timestamp',
        'validator': input => {
            try {
                iso8601ToBytes(input)
                return true
            }
            catch {
                return false
            }
        },
        'convert': input => iso8601ToBytes(input)
    },
    'rot13': { // Key kept as 'rot13' so existing links keep working
        'name': 'Caesar / ROT',
        'options': caesarOptions,
        'validator': input => true, // It can be any text
        'convert': (input, o) => new TextEncoder().encode(caesarShift(input, -o.shift, o.alphabet)) // Decode: shift backwards
    },
    'reverse': {
        'name': 'Reverse Text',
        'options': reverseOptions,
        'validator': input => true, // It can be any text
        'convert': (input, o) => new TextEncoder().encode(reverseText(input, o.by))
    },
    'jwt': {
        'name': 'JWT (decode)',
        'validator': input => {
            if (input.trim() === '') {
                return true
            }
            try {
                decodeJwt(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => input.trim() === '' ? new Uint8Array(0) : jwtToBytes(input)
    }
}


export const toFormats = {
    'utf8': {
        'name': 'Text (UTF-8)',
        'convert': input => new TextDecoder().decode(input)
    },
    'utf16le': {
        'name': 'Text (UTF-16)',
        'options': [
            utf16ByteOrderOption,
            { id: 'bom', label: 'Use Byte Order Mark if present', type: 'checkbox', default: false,
              title: 'If the data starts with a byte order mark (FF FE or FE FF), use the byte order it specifies and remove it from the text.' },
        ],
        'convert': (input, o) => bytesToUtf16(input, o.byteOrder === 'little', o.bom)
    },
    'hex': {
        'name': 'Hex',
        'convert': input => bytesToHex(input)
    },
    'octal': {
        'name': 'Octal',
        'convert': input => bytesToOctal(input)
    },
    'base32': {
        'name': 'Base32',
        'options': [
            { id: 'padding', label: 'Padding (=)', type: 'checkbox', default: true },
        ],
        'convert': (input, o) => bytesToBase32(input, o.padding)
    },
    'base64': {
        'name': 'Base64',
        'caseSensitive': true,
        'options': [
            { id: 'padding', label: 'Padding (=)', type: 'checkbox', default: true },
            { id: 'wrap', label: 'Line Wrap', type: 'select', default: '0',
              choices: [['0', 'No wrapping'], ['64', '64 characters (PEM)'], ['76', '76 characters (MIME)']] },
        ],
        'convert': (input, o) => formatBase64(bytesToBase64(input), o.padding, Number(o.wrap))
    },
    'url': {
        'name': 'URL Encoding',
        'convert': input => encodeURIComponent(new TextDecoder().decode(input))
    },
    'base64url': {
        'name': 'Base64 URL',
        'caseSensitive': true,
        'options': [
            { id: 'padding', label: 'Padding (=)', type: 'checkbox', default: false },
        ],
        'convert': (input, o) => b64ToB64Url(bytesToBase64(input), o.padding)
    },
    'bytes': {
        'name': 'Byte Array',
        'options': [
            { id: 'separator', label: 'Separator', type: 'select', default: 'space',
              choices: [['space', 'Space'], ['comma', 'Comma (,)'], ['commaspace', 'Comma and space (, )']] },
            { id: 'brackets', label: 'Brackets [ ]', type: 'checkbox', default: false },
        ],
        'convert': (input, o) => bytesToBtext(input, o.separator, o.brackets)
    },
    'binary': {
        'name': 'Binary',
        'convert': input => bytesToBinary(input)
    },
    'decimal': {
        'name': 'Decimal',
        'options': decimalOptions,
        'convert': (input, o) => bytesToDecimal(input, o.byteOrder === 'little')
    },
    'ascii85': {
        'name': 'ASCII 85',
        'caseSensitive': true,
        'convert': input => bytesToAscii85(input)
    },
    'htmlentities': {
        'name': 'HTML Entities',
        'convert': input => bytesToHtmlentities(input)
    },
    'morse': {
        'name': 'Morse Code',
        'convert': input => textToMorse(new TextDecoder().decode(input))
    },
    'uuid4': {
        'name': 'UUIDv4',
        'convert': input => {
            if (input.length !== 16) {
                return 'Invalid UUIDv4 length! 16 bytes required. Current: ' + input.length
            }

            input[6] = (input[6] & 0x0f) | 0x40 // Set version (UUIDv4 = 0100)
            input[8] = (input[8] & 0x3f) | 0x80 // Set variant (10xx)

            // Convert bytes to UUID string format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            const hex = [...input].map(b => b.toString(16).padStart(2, '0'))
            return [
                hex.slice(0, 4).join(''),
                hex.slice(4, 6).join(''),
                hex.slice(6, 8).join(''),
                hex.slice(8, 10).join(''),
                hex.slice(10, 16).join('')
            ].join('-')
        }
    },
    'hexdump': {
        'name': 'Hex Dump',
        'options': [
            { id: 'bytesPerLine', label: 'Bytes per Line', type: 'number', default: 16, min: 1, max: 64 },
            { id: 'ascii', label: 'Show ASCII Column', type: 'checkbox', default: true },
        ],
        'convert': (input, o) => bytesToHexDump(input, o.bytesPerLine, o.ascii)
    },
    'ipv4': {
        'name': 'IPv4 Address',
        'convert': input => bytesToIpv4(input)
    },
    'ipv6': {
        'name': 'IPv6 Address',
        'options': [
            { id: 'compress', label: 'Compress Zeros (::)', type: 'checkbox', default: true,
              title: 'Shorten the address by removing leading zeros and replacing the longest run of zero groups with ::' },
        ],
        'convert': (input, o) => bytesToIpv6(input, o.compress)
    },
    'iso8601': {
        'name': 'ISO 8601 Timestamp',
        'convert': input => bytesToIso8601(input)
    },

    // Hashes
    'md5': {
        'name': 'MD5 Hash',
        'convert': input => bytesToMd5(input),
    },
    'sha1': {
        'name': 'SHA1 Hash',
        'convert': input => bytesToSha1(input),
    },
    'sha256': {
        'name': 'SHA256 Hash',
        'convert': input => bytesToSha256(input),
    },
    'sha512': {
        'name': 'SHA512 Hash',
        'convert': input => bytesToSha512(input),
    },
    'hmac': {
        'name': 'HMAC',
        'options': [
            { id: 'algorithm', label: 'Algorithm', type: 'select', default: 'SHA256',
              choices: [['MD5', 'HMAC-MD5'], ['SHA1', 'HMAC-SHA1'], ['SHA256', 'HMAC-SHA256'], ['SHA512', 'HMAC-SHA512']] },
            { id: 'key', label: 'Key', type: 'text', default: '', secret: true,
              title: 'The secret key, used as UTF-8 text. It is never stored in the URL.' },
        ],
        'convert': (input, o) => bytesToHmac(input, o.algorithm, o.key),
    },
    'pbkdf2': {
        'name': 'PBKDF2 Hash',
        'caseSensitive': true,
        'options': [
            { id: 'hash', label: 'Hash', type: 'select', default: 'SHA-256',
              choices: [['SHA-1', 'SHA-1'], ['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512']] },
            { id: 'iterations', label: 'Iterations', type: 'number', default: 350000, min: 1, max: 10000000 },
            { id: 'keyLength', label: 'Key Length (bits)', type: 'number', default: 256, min: 8, max: 4096, step: 8 },
            { id: 'salt', label: 'Salt (hex)', type: 'text', default: '', secret: true, placeholder: 'random',
              title: 'Salt as a hex string. Leave empty to generate a random 16-byte salt. It is never stored in the URL.' },
            { id: 'output', label: 'Output', type: 'select', default: 'full',
              choices: [['full', 'Full (pbkdf2$...)'], ['digest', 'Digest only (hex)']],
              title: 'Full: pbkdf2$hash$iterations$salt$digest, which contains everything needed to verify the password. Digest only: just the derived key in hex.' },
        ],
        'convert': (input, o) => bytesToPbkdf2(input, o.hash, o.iterations, o.keyLength, o.salt, o.output), // async
    },

    // Checksums
    'crc32': {
        'name': 'CRC32 Checksum',
        'convert': input => bytesToCrc32(input),
    },

    // Misc
    'words': { // Key kept as 'words' so existing links keep working
        'name': 'Count',
        'options': [
            { id: 'mode', label: 'Count', type: 'select', default: 'words',
              choices: [['words', 'Words'], ['characters', 'Characters'], ['lines', 'Lines'], ['bytes', 'Bytes']] },
        ],
        'convert': (input, o) => countText(input, o.mode),
    },
    'rot13': { // Key kept as 'rot13' so existing links keep working
        'name': 'Caesar / ROT',
        'options': caesarOptions,
        'convert': (input, o) => caesarShift(new TextDecoder().decode(input), o.shift, o.alphabet)
    },
    'reverse': {
        'name': 'Reverse Text',
        'options': reverseOptions,
        'convert': (input, o) => reverseText(new TextDecoder().decode(input), o.by)
    },
}
