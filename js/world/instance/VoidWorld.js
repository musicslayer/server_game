const path = require("path");

const GameMap = require("../GameMap.js");
const GeneratorWorld = require("./GeneratorWorld.js");
const Util = require("../../util/Util.js");

class VoidWorld extends GeneratorWorld {
    getNamePrefix() {
        return "_void_";
    }

    isIDAllowed(id) {
        return Util.getClassName(id) === "Number";
    }

    createMap(id) {
        let voidMap = GameMap.loadMapFromFolder(this, "VoidMap", path.join(this.worldFolder, "_void"))
        voidMap.name = this.getNamePrefix() + id;
        voidMap.id = id;

        this.addMap(voidMap);
        
        return voidMap;
    }
}

module.exports = VoidWorld;