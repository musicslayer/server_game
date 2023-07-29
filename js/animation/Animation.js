const Reflection = require("../reflection/Reflection.js");
const Util = require("../util/Util.js");

class Animation {
    scheduleTasks(server) {
        let animationDataArray = this.getAnimationServerTasks(this) ?? [];
        for(let animationData of animationDataArray) {
            server.scheduleTask(animationData.animation, animationData.time, animationData.serverTask);
        }
    }

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
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return animation;
    }
}

module.exports = Animation;