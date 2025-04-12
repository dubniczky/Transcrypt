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