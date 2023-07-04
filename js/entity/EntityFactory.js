class EntityFactory {
    static createInstance(className, number, ...args) {
        const Reflection = require("../reflection/Reflection.js");
        const UnknownEntity = require("./UnknownEntity.js");

        let entity = Reflection.createInstance(className, ...args) ?? new UnknownEntity(...args);
        entity.stackSize = number;
        return entity;
    }
}

module.exports = EntityFactory;