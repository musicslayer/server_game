const World = require("../World.js");
const Util = require("../../util/Util.js");

class GeneratorWorld extends World {
    // A generator world is a world used to generate maps that will be attached to the entity's current world.
    isGeneratorWorld = true;

    getMapByName(name) {
        // Return a generated map if the name starts with the expected prefix for this generator world.
        let map;

        let prefix = this.getNamePrefix();
        if(name.startsWith(prefix)) {
            let id = Util.getStringOrNumber(name.slice(prefix.length));
            map = this.createMap(id);
        }

        return map;
    }

    getMapByID(id) {
        // Return a generated map if the id is allowed for this generator world.
        let map;

        if(this.isIDAllowed(id)) {
            map = this.createMap(id);
        }

        return map;
    }
}

module.exports = GeneratorWorld;