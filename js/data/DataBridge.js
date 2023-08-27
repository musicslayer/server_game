const fs = require("fs");

const Constants = require("../constants/Constants.js");
const DataReader = require("./DataReader.js");
const DataWriter = require("./DataWriter.js");

class DataBridge {
    static serialize(file, value) {
        let fd = fs.openSync(file, "w");

        let writeFcn = (s) => {
            let buffer = Buffer.from(s);
            fs.writeSync(fd, buffer);
        }

        let dataWriter = new DataWriter(writeFcn);
        dataWriter.serialize(undefined, value);

        fs.closeSync(fd);
    }

    static serializeMap(file, map) {
        let fd = fs.openSync(file, "w");

        let writeFcn = (s) => {
            let buffer = Buffer.from(s);
            fs.writeSync(fd, buffer);
        }

        let dataWriter = new DataWriter(writeFcn);
        dataWriter.serializeMap(undefined, map);

        fs.closeSync(fd);
    }

    static deserialize(file, className) {
        let fd = fs.openSync(file, "r");
        
        let readFcn = () => {
            let buffer = new Buffer.alloc(Constants.data.MAX_BYTES_READ);
            let numBytes = fs.readSync(fd, buffer);
            return buffer.subarray(0, numBytes);
        }

        let dataReader = new DataReader(readFcn);
        let value = dataReader.deserialize(undefined, className);

        fs.closeSync(fd);

        return value;
    }

    static deserializeMap(file, classNameKeys, classNameValues) {
        let fd = fs.openSync(file, "r");
        
        let readFcn = () => {
            let buffer = new Buffer.alloc(Constants.data.MAX_BYTES_READ);
            let numBytes = fs.readSync(fd, buffer);
            return buffer.subarray(0, numBytes);
        }

        let dataReader = new DataReader(readFcn);
        let map = dataReader.deserializeMap(undefined, classNameKeys, classNameValues);

        fs.closeSync(fd);

        return map;
    }
}

module.exports = DataBridge;