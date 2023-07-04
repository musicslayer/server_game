class WorldFactory {
    static createInstance(className) {
        const Reflection = require("../reflection/Reflection.js");
        
        return Reflection.createInstance(className);
    }
}

module.exports = WorldFactory;