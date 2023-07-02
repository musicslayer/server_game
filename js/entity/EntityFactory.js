const fs = require("fs");

class EntityFactory {
    static classMap = {};

    static init() {
        const modulesPaths = fs.readdirSync("js/entity/");
        modulesPaths.forEach((modulePath) => {
            let className = modulePath.substring(0, modulePath.length - 3);
            EntityFactory.classMap[className] = require("./" + modulePath)
        });
    }

    static createInstance(className, number, ...args) {
        let entity = new EntityFactory.classMap[className](...args) ?? new UnknownEntity(...args);
        entity.stackSize = number;
        return entity;
    }
}

module.exports = EntityFactory;