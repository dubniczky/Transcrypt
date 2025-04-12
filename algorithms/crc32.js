function bytesToCrc32(bytes) {
    const table = new Uint32Array(256)
    bytes = wordarrayToBytes(bytes)
  
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
  
    // Final XOR and return as hex string
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16)
}