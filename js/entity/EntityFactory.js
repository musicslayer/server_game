const Reflection = require("../reflection/Reflection.js");

class EntityFactory {
    static id = 0;
    static entityMap = new Map();

    static createInstance(className, stackSize, ...args) {
        let id = EntityFactory.id++;

        let entity = Reflection.createInstance(className, ...args) ?? Reflection.createInstance("UnknownEntity", ...args);
        entity.stackSize = stackSize;
        entity.id = id;

        EntityFactory.entityMap.set(id, entity);

        return entity;
    }
}

module.exports = EntityFactory;