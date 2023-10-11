const path = require("path");

const Constants = require("../constants/Constants.js");
const Reflection = require("../reflection/Reflection.js");
const World = require("./World.js");
const Util = require("../util/Util.js");

class Universe {
    server;
    id;
    name;

    worlds = [];
    worldNameMap = new Map();
    worldIDMap = new Map();

    universeFolder;

    static loadUniverse(server, className, universeFolder) {
        let universe = Reflection.createInstance(className);
        universe.server = server;
        universe.universeFolder = universeFolder;

        // Add generator worlds.
        universe.createWorld("_death", "death", "DeathWorld", "_death");
        universe.createWorld("_fallback", "fallback", "FallbackWorld", "_fallback");
        universe.createWorld("_tutorial", "tutorial", "TutorialWorld", "_tutorial");
        universe.createWorld("_void", "void", "VoidWorld", "_void");

        // Add regular worlds.
        for(let i = 0; i < Constants.performance.MAX_WORLDS; i++) {
            universe.createWorld("world", i, "World", "world" + i);
        }

        return universe;
    }

    createWorld(worldFolder, id, className, name) {
        let world = World.loadWorldFromFolder(this, className, path.join(this.universeFolder, worldFolder));
        world.id = id;
        world.name = name;

        this.addWorld(world);
    }

    addWorld(world) {
        this.worlds.push(world);
        this.worldNameMap.set(world.name, world);
        this.worldIDMap.set(world.id, world);
    }

    getWorldByName(name) {
        return this.worldNameMap.get(name);
    }

    getWorldByID(id) {
        return this.worldIDMap.get(id);
    }

    getGeneratorWorlds() {
        let generatorWorlds = [];

        for(let world of this.worlds) {
            if(world.isGeneratorWorld) {
                generatorWorlds.push(world);
            }
        }

        return generatorWorlds;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serializeArray("worlds", this.worlds)
        .endObject();
    }

    static deserialize(reader) {
        let universe;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            universe = new Universe();
            universe.id = Util.getStringOrNumber(reader.deserialize("id", "String"));
            universe.name = reader.deserialize("name", "String");
            let worlds = reader.deserializeArray("worlds", "World");

            for(let world of worlds) {
                world.universe = universe;
                universe.addWorld(world);
            }
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return universe;
    }
}

module.exports = Universe;