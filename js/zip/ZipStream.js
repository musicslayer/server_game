const fs = require("fs");
const path = require("path");
const stream = require("stream");
const zlib = require("zlib");

const SIG_LFH = 0x04034b50; // [80, 75, 3, 4]
const SIG_DD = 0x08074b50; // [80, 75, 7, 8]
const SIG_CFH = 0x02014b50; // [80, 75, 1, 2]
const SIG_EOCD = 0x06054b50; // [80, 75, 5, 6]
const SIG_ZIP64_EOCD = 0x06064b50; // [80, 75, 6, 6]
const SIG_ZIP64_EOCD_LOC = 0x07064b50; // [80, 75, 6, 7]

const ZIP64_MAGIC_SHORT = 0xffff;
const ZIP64_MAGIC = 0xffffffff;
const ZIP64_EXTRA_ID = 0x0001;

const MIN_VERSION_ZIP64 = 45;
const METHOD_DEFLATED = 8;

// Indicates that the size, csize, and crc values will not be known by the time we are writing local file headers.
// i.e. Each file will need a Data Descriptor after its content is written.
const GENERAL_BIT_FLAG = 8;

class ZipStream {
    fileDataArray = [];
    offset = 0n;

    outputFD;
    basePath;
    baseFolder;
    compressionLevel;
    archiveComment;

    constructor(zipFilePath, basePath, compressionLevel) {
        this.outputFD = fs.openSync(zipFilePath, "w");
        this.basePath = basePath;
        this.baseFolder = this.basePath.split(path.sep).slice(-1)[0];
        this.compressionLevel = compressionLevel;

        // For the archive comment, just use the empty string.
        this.archiveComment = "";
    }

    writeData(chunk) {
        if(chunk) {
            chunk = Buffer.from(chunk);
            this.offset += BigInt(chunk.length);
            fs.writeSync(this.outputFD, chunk);
        }
    }

    async addFile(filePath) {
        // Add a single file to the zip file.

        // For the name, use the path relative to basePath.
        // Join parts with the Unix filesep "/" regardless of which one is used by this OS.
        let relativefilePath = path.join(this.baseFolder, filePath.replace(this.basePath, ""));
        let relativeFileParts = relativefilePath.split(path.sep);
        let name = relativeFileParts.join("/");

        // For the time, convert the mtime to DOS time.
        let stats = fs.lstatSync(filePath);
        let time = dateToDos(stats.mtime, true);

        // For the extra, just use an empty buffer.
        let extra = Buffer.alloc(0);

        // For the comment, just use the empty string.
        let comment = "";

        // For internal and external attributes, just use 0.
        let internalAttributes = 0;
        let externalAttributes = 0;

        let fileData = {
            name: name,
            time: time,
            extra: extra,
            comment: comment,
            internalAttributes: internalAttributes,
            externalAttributes: externalAttributes,
            crc: 0,
            size: 0n,
            csize: 0n,
            fileOffset: this.offset,
        };

        this.fileDataArray.push(fileData);

        // Write data from this file into the zip file.
        this._writeLocalFileHeader(fileData);
        await this._writeLocalFileContent(filePath, fileData);
        this._writeDataDescriptor(fileData);
    }

    finish() {
        // Write the final data for the zip file and then close the stream.
        let records = BigInt(this.fileDataArray.length);
        let centralOffset = this.offset;
    
        for(let fileData of this.fileDataArray) {
            if(isFileZip64(fileData.size, fileData.csize, fileData.fileOffset)) {
                addZip64Values(fileData);
            }

            this._writeCentralFileHeader(fileData);
        }
    
        let centralLength = this.offset - centralOffset;
    
        if(isArchiveZip64(records, centralLength, centralOffset)) {
            this._writeCentralDirectoryZip64(records, centralLength, centralOffset);
            this._writeCentralDirectoryEnd(ZIP64_MAGIC_SHORT, ZIP64_MAGIC, ZIP64_MAGIC);
        }
        else {
            this._writeCentralDirectoryEnd(Number(records), Number(centralLength), Number(centralOffset));
        }

        fs.closeSync(this.outputFD);
    }

    _writeLocalFileHeader(fileData) {
        // signature
        this.writeData(getLongBytes(SIG_LFH));
      
        // version to extract and general bit flag
        this.writeData(getShortBytes(MIN_VERSION_ZIP64));
        this.writeData(getShortBytes(GENERAL_BIT_FLAG));
      
        // compression method
        this.writeData(getShortBytes(METHOD_DEFLATED));
      
        // datetime
        this.writeData(getLongBytes(fileData.time));
      
        // crc32 checksum, compressed size, and uncompressed size
        // Use zeroes here because we are using the Data Descriptor.
        this.writeData(getLongBytes(0));
        this.writeData(getLongBytes(0));
        this.writeData(getLongBytes(0));
      
        // name length
        this.writeData(getShortBytes(fileData.name.length));
      
        // extra length
        this.writeData(getShortBytes(fileData.extra.length));
      
        // name
        this.writeData(fileData.name);
      
        // extra
        this.writeData(fileData.extra);
    }

    async _writeLocalFileContent(filePath, fileData) {
        // Create the stream pipeline that will stream data from the uncompressed file into a zlib compressor and then into the zip file.

        // Read file.
        let inputStream = fs.createReadStream(filePath);
        
        // Intercept uncompressed data.
        let uncompressedPassThroughStream = new stream.PassThrough();
        uncompressedPassThroughStream.on("data", (chunk) => {
            if(chunk) {
                fileData.crc = crc32(chunk, fileData.crc);
                fileData.size += BigInt(chunk.length);
            }
        })

        // Compress data with zlib
        let compressStream = zlib.createDeflateRaw({ level: this.compressionLevel });
        
        // Intercept compressed data.
        let compressedPassThroughStream = new stream.PassThrough();
        compressedPassThroughStream.on("data", (chunk) => {
            if(chunk) {
                fileData.csize += BigInt(chunk.length);
                this.writeData(chunk);
            }
        })

        await stream.promises.pipeline(inputStream, uncompressedPassThroughStream, compressStream, compressedPassThroughStream);
    }

    _writeDataDescriptor(fileData) {
        // signature
        this.writeData(getLongBytes(SIG_DD));
      
        // crc32 checksum
        this.writeData(getLongBytes(fileData.crc));
      
        // sizes
        if(isFileZip64(fileData.size, fileData.csize, fileData.fileOffset)) {
            this.writeData(getEightBytes(fileData.csize));
            this.writeData(getEightBytes(fileData.size));
        }
        else {
            this.writeData(getLongBytes(Number(fileData.csize)));
            this.writeData(getLongBytes(Number(fileData.size)));
        }
    }

    _writeCentralFileHeader(fileData) {
        // signature
        this.writeData(getLongBytes(SIG_CFH));
      
        // version made by
        this.writeData(getShortBytes(MIN_VERSION_ZIP64));
      
        // version to extract and general bit flag
        this.writeData(getShortBytes(MIN_VERSION_ZIP64));
        this.writeData(getShortBytes(GENERAL_BIT_FLAG));
      
        // compression method
        this.writeData(getShortBytes(METHOD_DEFLATED));
      
        // datetime
        this.writeData(getLongBytes(fileData.time));
      
        // crc32 checksum
        this.writeData(getLongBytes(fileData.crc));
      
        // sizes
        this.writeData(getLongBytes(Number(fileData.csize)));
        this.writeData(getLongBytes(Number(fileData.size)));
      
        // name length
        this.writeData(getShortBytes(fileData.name.length));
      
        // extra length
        this.writeData(getShortBytes(fileData.extra.length));
      
        // comments length
        this.writeData(getShortBytes(fileData.comment.length));
      
        // disk number start (just use 0)
        this.writeData(getShortBytes(0));
      
        // internal attributes
        this.writeData(getShortBytes(fileData.internalAttributes));
      
        // external attributes
        this.writeData(getLongBytes(fileData.externalAttributes));
      
        // relative offset of LFH
        this.writeData(getLongBytes(Number(fileData.fileOffset)));
      
        // name
        this.writeData(fileData.name);
      
        // extra
        this.writeData(fileData.extra);
      
        // comment
        this.writeData(fileData.comment);
    }

    _writeCentralDirectoryZip64(records, size, offset) {
        // signature
        this.writeData(getLongBytes(SIG_ZIP64_EOCD));
      
        // size of the ZIP64 EOCD record
        this.writeData(getEightBytes(44n));
      
        // version made by
        this.writeData(getShortBytes(MIN_VERSION_ZIP64));
      
        // version to extract
        this.writeData(getShortBytes(MIN_VERSION_ZIP64));
      
        // disk numbers (just use 0)
        this.writeData(getLongBytes(0));
        this.writeData(getLongBytes(0));
      
        // number of entries
        this.writeData(getEightBytes(records));
        this.writeData(getEightBytes(records));
      
        // length and location of CD
        this.writeData(getEightBytes(size));
        this.writeData(getEightBytes(offset));
      
        // end of central directory locator
        this.writeData(getLongBytes(SIG_ZIP64_EOCD_LOC));
      
        // disk number holding the ZIP64 EOCD record (just use 0)
        this.writeData(getLongBytes(0));
      
        // relative offset of the ZIP64 EOCD record
        this.writeData(getEightBytes(size + offset));
      
        // total number of disks (just use 1)
        this.writeData(getLongBytes(1));
    };

    _writeCentralDirectoryEnd(records, size, offset) {
        // signature
        this.writeData(getLongBytes(SIG_EOCD));
      
        // disk numbers (just use 0)
        this.writeData(getShortBytes(0));
        this.writeData(getShortBytes(0));
      
        // number of entries
        this.writeData(getShortBytes(records));
        this.writeData(getShortBytes(records));
      
        // length and location of CD
        this.writeData(getLongBytes(size));
        this.writeData(getLongBytes(offset));
      
        // archive comment
        this.writeData(getShortBytes(this.archiveComment.length));
        this.writeData(this.archiveComment);
    }
}

function isFileZip64(size, csize, fileOffset) {
    return size > ZIP64_MAGIC || csize > ZIP64_MAGIC || fileOffset > ZIP64_MAGIC;
};

function isArchiveZip64(records, centralLength, centralOffset) {
    return records > ZIP64_MAGIC_SHORT || centralLength > ZIP64_MAGIC || centralOffset > ZIP64_MAGIC;
}

function addZip64Values(fileData) {
    // Add the zip64 extra record and then modify certain values to use in the Central Directory entries.
    fileData.extra = Buffer.concat([
        fileData.extra,

        getShortBytes(ZIP64_EXTRA_ID),
        getShortBytes(24),
        getEightBytes(fileData.size),
        getEightBytes(fileData.csize),
        getEightBytes(fileData.fileOffset)
    ]);

    fileData.size = BigInt(ZIP64_MAGIC);
    fileData.csize = BigInt(ZIP64_MAGIC);
    fileData.fileOffset = BigInt(ZIP64_MAGIC);
}

function dateToDos(d, forceLocalTime) {
    // Convert a Date object into a DOS time value.
    // Note: "forceLocalTime" should be true for our usage because zip files have no concept of time zone,
    // so we need the time relative to the local time zone rather than GMT.
    let year = forceLocalTime ? d.getFullYear() : d.getUTCFullYear();
  
    if(year < 1980) {
        return 2162688; // 1980-1-1 00:00:00
    }
    else if(year >= 2044) {
        return 2141175677; // 2043-12-31 23:59:58
    }
  
    let val = {
        year: year,
        month: forceLocalTime ? d.getMonth() : d.getUTCMonth(),
        date: forceLocalTime ? d.getDate() : d.getUTCDate(),
        hours: forceLocalTime ? d.getHours() : d.getUTCHours(),
        minutes: forceLocalTime ? d.getMinutes() : d.getUTCMinutes(),
        seconds: forceLocalTime ? d.getSeconds() : d.getUTCSeconds()
    };
  
    return ((val.year - 1980) << 25)
    | ((val.month + 1) << 21)
    | (val.date << 16)
    | (val.hours << 11)
    | (val.minutes << 5)
    | (val.seconds / 2);
};

function getShortBytes(v) {
    var buf = Buffer.alloc(2);
    buf.writeUInt16LE(v);
    return buf;
};

function getLongBytes(v) {
    var buf = Buffer.alloc(4);
    buf.writeUInt32LE(v);
    return buf;
};

function getEightBytes(v) {
    var buf = Buffer.alloc(8);
    buf.writeBigUint64LE(v);
    return buf;
};

const CRC_TABLE = new Int32Array([
    0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419,
    0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4,
    0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07,
    0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
    0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856,
    0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
    0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4,
    0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
    0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3,
    0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a,
    0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599,
    0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
    0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190,
    0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f,
    0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e,
    0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
    0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed,
    0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
    0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3,
    0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
    0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a,
    0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5,
    0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010,
    0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
    0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17,
    0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6,
    0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615,
    0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
    0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344,
    0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
    0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a,
    0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
    0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1,
    0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c,
    0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef,
    0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
    0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe,
    0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31,
    0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c,
    0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
    0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b,
    0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
    0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1,
    0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
    0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278,
    0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7,
    0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66,
    0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
    0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605,
    0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8,
    0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b,
    0x2d02ef8d
]);

function crc32(buf, previous) {
    let crc = ~~previous ^ -1;
    for(let n = 0; n < buf.length; n++) {
        crc = CRC_TABLE[(crc ^ buf[n]) & 0xff] ^ (crc >>> 8);
    }

    // Always return an unsigned value.
    return (crc ^ -1) >>> 0;
}

module.exports = ZipStream;