const World = require("../World.js");
const Util = require("../../util/Util.js");

class DynamicWorld extends World {
    // A dynamic world is a world used to generate maps.
    // These are fixed non-instance worlds that are used to generate maps that will be attached to the entity's current world.
    isDynamic = true;

    getMapByName(name) {
        // Return a dynamically generated map if the name starts with the expected prefix for this dynamic world.
        let map;

        let prefix = this.getNamePrefix();
        if(name.startsWith(prefix)) {
            let id = Util.getStringOrNumber(name.slice(prefix.length));
            map = this.createDynamicMap(id);
        }

        return map;
    }

    getMapByID(id) {
        // Return a dynamically generated map if the id is allowed for this dynamic world.
        let map;

        if(this.isIDAllowed(id)) {
            map = this.createDynamicMap(id);
        }

        return map;
    }
}

module.exports = DynamicWorld;