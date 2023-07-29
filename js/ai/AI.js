const Reflection = require("../reflection/Reflection.js");

class AI {
    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", this.constructor.name)
            .serialize("defaultTime", this.defaultTime)
            .serialize("randomDirectionFlag", this.randomDirectionFlag)
            .endObject();
    }

    static deserialize(reader) {
        let ai;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let className = reader.deserialize("className", "String");
            ai = Reflection.createInstance(className);
            ai.defaultTime = reader.deserialize("defaultTime", "Number");
            ai.randomDirectionFlag = reader.deserialize("randomDirectionFlag", "Boolean");
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return ai;
    }
}

module.exports = AI;