class EntityFactory {
    static id = 0;
    static entityMap = new Map();

    static createInstance(className, number, ...args) {
        let id = EntityFactory.id++;

        const Reflection = require("../reflection/Reflection.js");
        const UnknownEntity = require("./UnknownEntity.js");

        let entity = Reflection.createInstance(className, ...args) ?? new UnknownEntity(...args);
        entity.stackSize = number;
        entity.id = id;

        EntityFactory.entityMap.set(id, entity);

        return entity;
    }
}

module.exports = EntityFactory;