const fs = require("fs");

class WorldFactory {
    static classMap = {};

    static init() {
        const modulesPaths = fs.readdirSync("js/world/");
        modulesPaths.forEach((modulePath) => {
            let className = modulePath.substring(0, modulePath.length - 3);
            WorldFactory.classMap[className] = require("./" + modulePath)
        });
    }

    static createInstance(className) {
        return new WorldFactory.classMap[className]();
    }
}

module.exports = WorldFactory;