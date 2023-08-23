const SIG_CFH = 0x02014b50;
const SIG_CFH_BYTES = [80, 75, 1, 2];

const ZIP64_EXTRA_ID = 0x0001;

const MAX_BYTES_READ = 65536;

class UnzipStream {
    zipFileContent;
    fileDataMap = new Map();

    zipFileData;

    constructor(zipFileData) {
        this.zipFileData = zipFileData;
    }

    openFile(initialOffset) {
        this.zipFileContent = this.zipFileData.slice(Number(initialOffset));
    }

    searchData(data) {
        // Returns the offset of "data" in the file.
        this.openFile(0n);

        let searchBytes = new Uint8Array(data);
        let firstByte = searchBytes[0];

        let index = 0;

        while((index = this.zipFileContent.indexOf(firstByte, index + 1)) !== -1) {
            if(JSON.stringify(this.zipFileContent.slice(index, index + searchBytes.length)) === JSON.stringify(searchBytes)) {
                break;
            }
        }

        return index;
    }

    async extractFiles() {
        // Read Central Directory entries to get file information, then read Local File entries to get file content.
        this.readCentralDirectoryEntries();
        await this.readLocalFileEntries();
    }

    readCentralDirectoryEntries() {
        // Jump to the first Central File header.
        let centralFileHeaderOffset = this.searchData(SIG_CFH_BYTES);
        this.openFile(centralFileHeaderOffset);

        while(this._readLong() === SIG_CFH) {
            let fileData = { uncompressedFileContent: new Uint8Array() };

            this._processCentralFileHeader(fileData);

            let zip64Record = getZip64ExtraRecord(fileData.extra)
            if(zip64Record) {
                // Use the values in the Zip64 record instead of the Central Directory.
                fileData.size = getEightValue(zip64Record.subarray(0, 8));
                fileData.csize = getEightValue(zip64Record.subarray(8, 16));
                fileData.fileOffset = getEightValue(zip64Record.subarray(16, 24));
            }

            this.fileDataMap.set(fileData.name, fileData);
        }
    }

    async readLocalFileEntries() {
        for(let fileData of this.fileDataMap.values()) {
            // For each "fileData" in the map, jump to its position in the zip file and look for the File Contents.
            this.openFile(fileData.fileOffset);

            this._processLocalFileHeader();
            await this._processLocalFileContent(fileData);
        }
    }

    _processLocalFileHeader() {
        // signature
        this._readLong();

        // version to extract and general bit flag
        this._readShort();
        this._readShort();

        // compression method
        this._readShort();

        // datetime
        this._readLong();

        // crc32 checksum, compressed size, and uncompressed size
        this._readLong();
        this._readLong();
        this._readLong();

        // name length
        let nameLength = this._readShort();

        // extra length
        let extraLength = this._readShort();

        // name
        this._readString(nameLength);

        // extra
        this._readBytes(extraLength);
    }

    async _processLocalFileContent(fileData) {
        // Create the stream pipeline that will stream compressed data into a zlib decompressor.

        // Note that "csize" is a BigInt and may be large, so we may not be able to process everything at once.
        let numBytes = fileData.csize;

        // Read data
        let inputStream = new ReadableStream({
            pull: (controller) => {
                let numBytesToRead = numBytes < MAX_BYTES_READ ? Number(numBytes) : MAX_BYTES_READ;
                numBytes -= BigInt(numBytesToRead);

                if(numBytesToRead > 0) {
                    controller.enqueue(this._readBytes(numBytesToRead));
                }
                else {
                    controller.close();
                }
            }
        });

        // Uncompress data with zlib
        let decompressStream = new DecompressionStream("deflate-raw");

        // Intercept uncompressed data
        let uncompressedPassThroughStream = new WritableStream({
            write: (chunk) => {
                if(chunk) {
                    fileData.uncompressedFileContent = concatUint8Array(fileData.uncompressedFileContent, chunk);
                }
            },
        });

        await inputStream.pipeThrough(decompressStream).pipeTo(uncompressedPassThroughStream);
    }

    _processCentralFileHeader(fileData) {
        // version made by
        this._readShort();
      
        // version to extract and general bit flag
        this._readShort();
        this._readShort();
      
        // compression method
        this._readShort();
      
        // datetime
        fileData.time = this._readLong();
      
        // crc32 checksum
        fileData.crc = this._readLong();
      
        // compressed size and uncompressed size
        fileData.csize = BigInt(this._readLong());
        fileData.size = BigInt(this._readLong());
      
        // name length
        let nameLength = this._readShort();
      
        // extra length
        let extraLength = this._readShort();
      
        // comments length
        let commentLength = this._readShort();
      
        // disk number start
        this._readShort();
      
        // internal attributes
        fileData.internalAttributes = this._readShort();
      
        // external attributes
        fileData.externalAttributes = this._readLong();
      
        // relative offset of LFH
        fileData.fileOffset = BigInt(this._readLong());
      
        // name
        fileData.name = this._readString(nameLength);
      
        // extra
        fileData.extra = this._readBytes(extraLength);
      
        // comment
        fileData.comment = this._readString(commentLength);
    }

    _readShort() {
        let bytes = this._readBytes(2);
        return getShortValue(bytes);
    };

    _readLong() {
        let bytes = this._readBytes(4);
        return getLongValue(bytes);
    };

    _readString(strLength) {
        let bytes = this._readBytes(strLength);
        return getStringValue(bytes);
    };

    _readBytes(n) {
        // Return and consume n bytes from zipFileContent.
        let bytes = this._peekBytes(n);
        this.zipFileContent = this.zipFileContent.subarray(n);
        return bytes;
    };

    _peekBytes(n) {
        // Return n bytes from zipFileContent.
        let bytes = this.zipFileContent.subarray(0, n);
        return bytes;
    };
}

function getZip64ExtraRecord(extra) {
    // Look for an extra record indicating the Zip64 format was used.
    while(extra.length > 0) {
        let id = getShortValue(readBytes(2));
        let recordLength = getShortValue(readBytes(2));
        let zip64Record = readBytes(recordLength);
        if(id === ZIP64_EXTRA_ID) {
            return zip64Record;
        }
    }

    return undefined;

    function readBytes(n) {
        // Return and consume n bytes from extra.
        let bytes = extra.subarray(0, n);
        extra = extra.subarray(n);
        return bytes;
    };
};

function getShortValue(bytes) {
    return bytes[0] | (bytes[1] << 8);
};

function getLongValue(bytes) {
    return bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
};

function getEightValue(bytes) {
    return BigInt(bytes[0]) | 
    (BigInt(bytes[1]) << 8n) |
    (BigInt(bytes[2]) << 16n) |
    (BigInt(bytes[3]) << 24n) |
    (BigInt(bytes[4]) << 32n) |
    (BigInt(bytes[5]) << 40n) |
    (BigInt(bytes[6]) << 48n) |
    (BigInt(bytes[7]) << 56n);
};

function getStringValue(bytes) {
    return new TextDecoder().decode(bytes);
};

function concatUint8Array(x, y) {
    let c = new Uint8Array(x.length + y.length)
    c.set(x);
    c.set(y, x.length);
    return c;
}

export { UnzipStream };