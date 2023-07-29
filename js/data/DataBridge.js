const fs = require("fs");

const DataReader = require("./DataReader.js");
const DataWriter = require("./DataWriter.js");

class DataBridge {
    static serializeObject(obj, file) {
        let fd = fs.openSync(file, "w");

        let writeFcn = (s) => {
            let buffer = Buffer.from(s);
            fs.writeSync(fd, buffer);
        }

        let dataWriter = new DataWriter(writeFcn);
        dataWriter.serialize(undefined, obj);

        fs.closeSync(fd);
    }

    static deserializeObject(className, file) {
        let fd = fs.openSync(file, "r");
        
        let readFcn = () => {
            let buffer = new Buffer.alloc(1024);
            fs.readSync(fd, buffer);
            return buffer;
        }

        let dataReader = new DataReader(readFcn);
        let obj = dataReader.deserialize(undefined, className);

        fs.closeSync(fd);

        return obj;
    }
}

module.exports = DataBridge;