const Reflection = require("../reflection/Reflection.js");
const EntityFactory = require("../entity/EntityFactory.js");

class Animation {
    getClassName() {
        return this.constructor.name;
    }

    scheduleTasks(server) {
        let animationDataArray = this.getAnimationServerTasks(this) ?? [];
        for(let animationData of animationDataArray) {
            server.scheduleTask(animationData.animation, animationData.time, animationData.serverTask);
        }
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("className", this.getClassName());

        if(this.getClassName() === "MoveAnimation") {
            writer.serialize("entity", this.entity.id)
                .serialize("time", this.time)
        }

        writer.endObject();
    }

    static deserialize(reader) {
        let animation;

        reader.beginObject();
        let className = reader.deserialize("className", "String");

        let entity;
        let time;
        if(className === "MoveAnimation") {
            entityID = reader.deserialize("entity", "Number");
            time = reader.deserialize("time", "Number");

            entity = EntityFactory.entityMap.get(entityID);
        }

        reader.endObject();

        animation = Reflection.createInstance(className);
        animation.entity = entity;
        animation.time = time;

        return animation;
    }
}

module.exports = Animation;