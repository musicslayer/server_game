const Reflection = require("../reflection/Reflection.js");

class AI {
    getClassName() {
        return this.constructor.name;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", this.getClassName());

        // TODO Get rid of.
        if(this.getClassName() === "MonsterAI") {
            writer.serialize("defaultTime", this.defaultTime)
                .serialize("randomDirectionFlag", this.randomDirectionFlag)
        }

        writer.endObject();
    }

    static deserialize(reader) {
        let ai;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let className = reader.deserialize("className", "String");
            ai = Reflection.createInstance(className);

            if(className === "MonsterAI") {
                ai.defaultTime = reader.deserialize("defaultTime", "Number");
                ai.randomDirectionFlag = reader.deserialize("randomDirectionFlag", "Boolean");
            }
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return ai;
    }
}

module.exports = AI;