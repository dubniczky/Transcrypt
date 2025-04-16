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

function bytesToSha3(bytes) {
    return CryptoJS.SHA3(bytesToWordarray(bytes)).toString()
}
