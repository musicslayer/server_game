const path = require("path");

const GameMap = require("../GameMap.js");
const DynamicWorld = require("./DynamicWorld.js");
const Util = require("../../util/Util.js");

const NAME_PREFIX = "_void_";

class VoidWorld extends DynamicWorld {
    getNamePrefix() {
        return NAME_PREFIX;
    }

    isIDAllowed(id) {
        return Util.getClassName(id) === "Number";
    }

    createDynamicMap(id) {
        let voidMap = GameMap.loadMapFromFolder(this, "VoidMap", path.join(this.worldFolder, "_void"))
        voidMap.name = NAME_PREFIX + id;
        voidMap.id = id;

        this.addMap(voidMap);
        
        return voidMap;
    }
}

module.exports = VoidWorld;