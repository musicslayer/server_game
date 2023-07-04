const Reader = require("./Reader.js");
const Writer = require("./Writer.js");

class DataBridge {
    static serializeObject(obj) {
        let writer = new Writer();
        writer.serialize(undefined, obj);
        return writer.toString();
    }

    static deserializeObject(s, className) {
        let reader = new Reader(s);
        return reader.deserialize(undefined, className);
    }
}

module.exports = DataBridge;