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
