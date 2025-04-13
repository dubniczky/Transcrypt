// WordArray (CryptoJS) <=> Uint8Array (bytes)
function wordarrayToBytes(wordArray) {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const bytes = [];
  
    for (let i = 0; i < sigBytes; i++) {
        const word = words[Math.floor(i / 4)];
        const byte = (word >> (24 - (i % 4) * 8)) & 0xFF;
        bytes.push(byte);
    }
  
    return bytes;
}
function bytesToWordarray(u8Array) {
    const words = []
    for (let i = 0; i < u8Array.length; i += 4) {
        words.push(
            ((u8Array[i]     || 0) << 24) |
            ((u8Array[i + 1] || 0) << 16) |
            ((u8Array[i + 2] || 0) << 8)  |
            ((u8Array[i + 3] || 0))
        );
    }
  
    return CryptoJS.lib.WordArray.create(words, u8Array.length)
}


// Hex <=> Uint8Array (bytes)
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes
}
function btextToBytes(btext) {
    const bints = btext.split(' ')
    const bytes = new Uint8Array(bints.length)
    for (let i = 0; i < bints.length; i++) {
        bytes[i] = parseInt(bints[i], 10)
    }
    return bytes
}

// Text <=> Hex
function textToHex(str) {
    let hex = ''
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16)
    }
    return hex
}

function hexToText(hex) {
    let str = ''
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    }
    return str
}


// Base64 <=> Base64URL
function b64ToB64Url(base64) {
    return base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64UrlToB64(base64url) {
    return base64url.replace(/-/g, '+').replace(/_/g, '/')
}


// Binary string <=> UInt8Array (bytes)
function binaryToBytes(binary) {
    binary = binary.replace(/\s+/g, '') // Remove all spaces
    let length = binary.length - binary.length % 8 // ignore extra bits at the end

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


// Uint8Array & WordArray => Hashes
function bytesToMd5(bytes) {
    if (bytes instanceof Uint8Array) {
        bytes = bytesToWordarray(bytes)
    }
    return CryptoJS.MD5(bytes).toString()
}

function bytesToSha1(bytes) {
    if (bytes instanceof Uint8Array) {
        bytes = bytesToWordarray(bytes)
    }
    return CryptoJS.SHA1(bytes).toString()
}

function bytesToSha256(bytes) {
    if (bytes instanceof Uint8Array) {
        bytes = bytesToWordarray(bytes)
    }
    return CryptoJS.SHA256(bytes).toString()
}

function bytesToSha512(bytes) {
    if (bytes instanceof Uint8Array) {
        bytes = bytesToWordarray(bytes)
    }
    return CryptoJS.SHA512(bytes).toString()
}

function bytesToSha3(bytes) {
    if (bytes instanceof Uint8Array) {
        bytes = bytesToWordarray(bytes)
    }
    return CryptoJS.SHA3(bytes).toString()
}

function bytesToSha512_256(bytes) {
    if (bytes instanceof Uint8Array) {
        bytes = bytesToWordarray(bytes)
    }
    return CryptoJS.SHA512(bytes).toString(CryptoJS.enc.Hex).slice(0, 64)
}
