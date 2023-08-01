const path = require("path");

const GameMap = require("./GameMap.js");
const World = require("./World.js");

const NAME_PREFIX = "_void_";

class VoidWorld extends World {
    getMapByName(name) {
        // Return a dynamically generated "void" map if the name starts with the expected prefix.
        let map;

        if(name.startsWith(NAME_PREFIX)) {
            let id = name.slice(NAME_PREFIX.length);
            map = this.createVoidMap(Number(id));
        }

        return map;
    }

    getMapByID(id) {
        // Always return a dynamically generated "void" map.
        return this.createVoidMap(id);
    }

    createVoidMap(id) {
        let voidMap = GameMap.loadMapFromFolder("VoidMap", path.join(this.worldFolder, "_void"))
        voidMap.world = this;
        voidMap.name = NAME_PREFIX + id;
        voidMap.id = id;
        
        return voidMap;
    }
}

module.exports = VoidWorld;