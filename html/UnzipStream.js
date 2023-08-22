const SIG_LFH = 0x04034b50; // [80, 75, 3, 4]
const SIG_DD = 0x08074b50; // [80, 75, 7, 8]
const SIG_CFH = 0x02014b50; // [80, 75, 1, 2]
const SIG_EOCD = 0x06054b50; // [80, 75, 5, 6]
const SIG_ZIP64_EOCD = 0x06064b50; // [80, 75, 6, 6]

const ZIP64_EXTRA_ID = 0x0001;

const MAX_BYTES_READ = 65536;

class UnzipStream {
    zipFileContent;
    fileDataMap = new Map();

    zipFileData;

    constructor(zipFileData) {
        this.zipFileData = zipFileData;
    }

    async extractFiles() {
        // Read Central Directory entries to get file information, then read Local File entries to get file content.
        await this.readCentralDirectoryEntries();
        await this.readLocalFileEntries();
    }

    async readCentralDirectoryEntries() {
        this.zipFileContent = this.zipFileData;

        // Skip all the Local File entries.
        this._searchLong(SIG_CFH);

        let done = false;
        while(!done) {
            let signature = this._readLong();
            switch(signature) {
                case SIG_CFH:
                    let fileData = {};

                    this._processCentralFileHeader(fileData);

                    let zip64Record = getZip64ExtraRecord(fileData.extra)
                    if(zip64Record) {
                        // Use the values in the Zip64 record instead of the Central Directory.
                        fileData.size = getEightValue(zip64Record.subarray(0, 8));
                        fileData.csize = getEightValue(zip64Record.subarray(8, 16));
                        fileData.fileOffset = getEightValue(zip64Record.subarray(16, 24));
                    }

                    this.fileDataMap.set(fileData.name, fileData);

                    break;

                case SIG_EOCD:
                    this._processCentralDirectoryEnd();

                    // This is always the last section of a zip file.
                    done = true;

                    break;

                case SIG_ZIP64_EOCD:
                    this._processCentralDirectoryZip64();
                    break;

                default:
                    throw("Invalid signature: " + signature);
            }
        }
    }

    async readLocalFileEntries() {
        this.zipFileContent = this.zipFileData;

        let currentFileData;

        let done = false;
        while(!done) {
            let signature = this._readLong();
            switch(signature) {
                case SIG_LFH:
                    currentFileData = {};
                    this._processLocalFileHeader(currentFileData);

                    let zip64Record = getZip64ExtraRecord(currentFileData.extra)
                    if(zip64Record) {
                        // Use the values in the Zip64 record instead of the Central Directory.
                        currentFileData.size = getEightValue(zip64Record.subarray(0, 8));
                        currentFileData.csize = getEightValue(zip64Record.subarray(8, 16));
                        currentFileData.fileOffset = getEightValue(zip64Record.subarray(16, 24));
                    }

                    // If fileData is in the map, than the data in the Local File entry is not needed.
                    // If fileData is not in the map, we do not need any of this data but we still must process it.
                    if(this.fileDataMap.has(currentFileData.name)) {
                        currentFileData = this.fileDataMap.get(currentFileData.name);
                    }
                    await this._processLocalFileContent(currentFileData);
                    
                    break;

                case SIG_DD:
                    this._processDataDescriptor(currentFileData);
                    break;

                case SIG_CFH:
                    // At this point we have read all the Local File entries.
                    done = true;
                    break;

                default:
                    throw("Invalid signature: " + signature);
            }
        }
    }

    _processLocalFileHeader(fileData) {
        // version to extract and general bit flag
        this._readShort();
        this._readShort();

        // compression method
        this._readShort();

        // datetime
        fileData.time = this._readLong();

        // crc32 checksum and sizes
        fileData.crc = this._readLong();
        fileData.csize = BigInt(this._readLong());
        fileData.size = BigInt(this._readLong());

        // name length
        let nameLength = this._readShort();

        // extra length
        let extraLength = this._readShort();

        // name
        fileData.name = this._readString(nameLength);

        // extra
        fileData.extra = this._readBytes(extraLength);
    }

    async _processLocalFileContent(fileData) {
        // Decompress the file content.
		return new Promise(async (resolve) => {
			fileData.uncompressedFileContent = new Uint8Array();

			let decompressStream = new DecompressionStream("deflate-raw");
			let decompressWriteStream = decompressStream.writable;
			let decompressWriter = decompressWriteStream.getWriter();
			let decompressReadStream = decompressStream.readable;
			let decompressReader = decompressReadStream.getReader();

			if(fileData.csize > 0) {
				// We know exactly how many bytes to read. Note that "csize" is a BigInt.
				let numBytes = fileData.csize;

				while(numBytes > MAX_BYTES_READ) {
					numBytes -= MAX_BYTES_READ;
					decompressWriter.write(this._readBytes(MAX_BYTES_READ));
				}

				// At this point, we know "numBytes" is small enough to safely convert into a Number.
				decompressWriter.write(this._readBytes(Number(numBytes)));
			}
			else {
				// We don't know how far to read, so keep going until we see the next Data Descriptor signature.
				// This case will only happen if there is a Data Descriptor for this file.
				this._searchLong(SIG_DD, (chunk) => {
					decompressWriter.write(chunk);
				});
			}

			//await decompressWriter.ready;
			//decompressWriter.releaseLock();
			//await decompressWriter.closed;
			//await decompressStream.close();
			
			//await decompressWriter.close();
			
			console.log("CLOSE START");
			/*
			decompressWriter.close().then(() => {
				console.log("CLOSE END");
			});
			*/
			
			//decompressWriter.close();
			
			decompressWriter.releaseLock();
			decompressWriteStream.close();
			
			while(true) {
				let readData = await decompressReader.read();
				
				if(readData.done) {
					break;
				}
				
				let chunk = readData.value;
				fileData.uncompressedFileContent = concatUint8Array(fileData.uncompressedFileContent, chunk);
			}
			
			resolve();
			
			//decompressReadStream.close();
			
			/*
			decompressWriter.closed.then(() => {
				console.log("CLOSE END");
			});
			*/
		});
    }

    _processDataDescriptor(fileData) {
        // crc32 checksum
        fileData.crc = this._readLong();

        // sizes
        if(getZip64ExtraRecord(fileData.extra)) {
            fileData.csize = this._readEight();
            fileData.size = this._readEight();
        }
        else {
            fileData.csize = BigInt(this._readLong());
            fileData.size = BigInt(this._readLong());
        }
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
      
        // sizes
        fileData.csize = this._readLong();
        fileData.size = this._readLong();
      
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

    _processCentralDirectoryZip64() {
        // size of the ZIP64 EOCD record
        this._readEight();
      
        // version made by
        this._readShort();
      
        // version to extract
        this._readShort();
      
        // disk numbers
        this._readLong();
        this._readLong();
      
        // number of entries
        this._readEight();
        this._readEight();
      
        // length and location of CD
        this._readEight();
        this._readEight();
      
        // end of central directory locator
        this._readLong();
      
        // disk number holding the ZIP64 EOCD record
        this._readLong();
      
        // relative offset of the ZIP64 EOCD record
        this._readEight();
      
        // total number of disks
        this._readLong();
    }

    _processCentralDirectoryEnd() {
        // disk numbers
        this._readShort();
        this._readShort();
      
        // number of entries
        this._readShort();
        this._readShort();
      
        // length and location of CD
        this._readLong();
        this._readLong();
      
        // archive comment
        let archiveCommentLength = this._readShort();
        this._readString(archiveCommentLength);
    }

    _readShort() {
        let bytes = this._readBytes(2);
        return getShortValue(bytes);
    };

    _readLong() {
        let bytes = this._readBytes(4);
        return getLongValue(bytes);
    };

    _readEight() {
        let bytes = this._readBytes(8);
        return getEightValue(bytes);
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

    _searchLong(v, callback) {
        // Consume bytes from zipFileContent, stopping when the value "v" is found or there is no more data left.
        // If a callback is provided, the consumed bytes will be passed in. 
        let data = new Uint8Array();
        while(this._peekLong() !== v) {
			data = concatUint8Array(data, this._readBytes(1));

            if(data.length === MAX_BYTES_READ) {
                if(callback) {
                    callback(data);
                }
                data = new Uint8Array();
            }
        }

        if(callback) {
            callback(data);
        }

        return;
    }

    _peekLong() {
        let bytes = this._peekBytes(4);
        return getLongValue(bytes);
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
	return ((bytes[0]) | (bytes[1] << 8) | (bytes[2] << 16)) + (bytes[3] * 0x1000000);
};

function getEightValue(bytes) {
	const lo = bytes[0] +
    bytes[1] * 2 ** 8 +
    bytes[2] * 2 ** 16 +
    bytes[3] * 2 ** 24

	const hi = bytes[4] +
    bytes[5] * 2 ** 8 +
    bytes[6] * 2 ** 16 +
    bytes[7] * 2 ** 24

	return BigInt(lo) + (BigInt(hi) << BigInt(32))
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