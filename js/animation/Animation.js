const Reflection = require("../reflection/Reflection.js");
const Util = require("../util/Util.js");

class Animation {
    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", Util.getClassName(this))
            .reference("entity", this.entity)
            .serialize("time", this.time)
        .endObject();
    }

    static deserialize(reader) {
        let animation;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let className = reader.deserialize("className", "String");
            animation = Reflection.createInstance(className);
            animation.entity = reader.dereference("entity", "Entity");
            animation.time = reader.deserialize("time", "Number");
            
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return animation;
    }
}

module.exports = Animation;