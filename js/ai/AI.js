const Reflection = require("../reflection/Reflection.js");

class AI {
    getClassName() {
        return this.constructor.name;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("className", this.getClassName());

        if(this.getClassName() === "MonsterAI") {
            writer.serialize("defaultTime", this.defaultTime)
                .serialize("randomDirectionFlag", this.randomDirectionFlag)
        }

        writer.endObject();
    }

    static deserialize(reader) {
        let ai;

        reader.beginObject();
        let className = reader.deserialize("className", "String");

        let defaultTime;
        let randomDirectionFlag;
        if(className === "MonsterAI") {
            defaultTime = reader.deserialize("defaultTime", "Number");
            randomDirectionFlag = reader.deserialize("randomDirectionFlag", "Boolean");
        }

        reader.endObject();

        ai = Reflection.createInstance(className);

        ai.defaultTime = defaultTime;
        ai.randomDirectionFlag = randomDirectionFlag;

        return ai;
    }
}

module.exports = AI;