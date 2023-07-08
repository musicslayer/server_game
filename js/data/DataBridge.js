const DataReader = require("./DataReader.js");
const DataWriter = require("./DataWriter.js");

class DataBridge {
    static serializeObject(obj, writer) {
        return new Promise((resolve) => {
            let dataWriter = new DataWriter(writer);
            dataWriter.serialize(undefined, obj);
            writer.end(resolve);
        });
    }

    static deserializeObject(className, reader) {
        return new Promise(async (resolve) => {
            //let dataReader = new DataReader(reader);
            let dataReader = new DataReader();
            await dataReader.process(reader);
            let obj = dataReader.deserialize(undefined, className);
            //reader.end(() => { resolve(obj); });

            reader.on("close", () => { resolve(obj); });
        });
    }
}

module.exports = DataBridge;