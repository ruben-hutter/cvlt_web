import { inflateRawSync } from 'zlib'

// Minimal ZIP extractor for KMZ files (single KML entry)
export async function decompress(buffer: ArrayBuffer): Promise<string> {
  const buf = Buffer.from(buffer)

  // Verify ZIP magic
  if (buf[0] !== 0x50 || buf[1] !== 0x4b || buf[2] !== 0x03 || buf[3] !== 0x04) {
    throw new Error('Not a ZIP file')
  }

  const fileNameLen = buf.readUInt16LE(26)
  const extraLen = buf.readUInt16LE(28)
  const dataOffset = 30 + fileNameLen + extraLen

  // Get compressed size from central directory (local header may have 0 due to data descriptor flag)
  let compressedSize = buf.readUInt32LE(18)
  if (compressedSize === 0) {
    // Find End of Central Directory record (PK\x05\x06)
    for (let i = buf.length - 22; i >= 0; i--) {
      if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
        const cdOffset = buf.readUInt32LE(i + 16)
        compressedSize = buf.readUInt32LE(cdOffset + 20)
        break
      }
    }
  }

  const compressedData = buf.slice(dataOffset, dataOffset + compressedSize)
  const decompressed = inflateRawSync(compressedData)
  return decompressed.toString('latin1')
}
