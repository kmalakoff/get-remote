// Simple file type detection via magic bytes
// Compatible with Node 0.8+ (no dependencies)
// Supports: tar, tar.gz, tar.bz2, tar.xz, tgz, zip, 7z, gz, bz2, xz

export interface FileTypeResult {
  ext: string;
  mime: string;
}

export default function fileType(buffer: Buffer): FileTypeResult | null {
  if (!buffer || buffer.length < 262) return null;

  // ZIP: PK\x03\x04
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return { ext: 'zip', mime: 'application/zip' };
  }

  // GZIP: \x1f\x8b
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return { ext: 'gz', mime: 'application/gzip' };
  }

  // BZIP2: BZ
  if (buffer[0] === 0x42 && buffer[1] === 0x5a && buffer[2] === 0x68) {
    return { ext: 'bz2', mime: 'application/x-bzip2' };
  }

  // XZ: \xfd7zXZ\x00
  if (buffer[0] === 0xfd && buffer[1] === 0x37 && buffer[2] === 0x7a && buffer[3] === 0x58 && buffer[4] === 0x5a && buffer[5] === 0x00) {
    return { ext: 'xz', mime: 'application/x-xz' };
  }

  // 7Z: 7z\xbc\xaf\x27\x1c
  if (buffer[0] === 0x37 && buffer[1] === 0x7a && buffer[2] === 0xbc && buffer[3] === 0xaf && buffer[4] === 0x27 && buffer[5] === 0x1c) {
    return { ext: '7z', mime: 'application/x-7z-compressed' };
  }

  // TAR: "ustar" at offset 257
  if (buffer.length >= 262) {
    const ustar = buffer[257] === 0x75 && buffer[258] === 0x73 && buffer[259] === 0x74 && buffer[260] === 0x61 && buffer[261] === 0x72;
    if (ustar) {
      return { ext: 'tar', mime: 'application/x-tar' };
    }
  }

  return null;
}
