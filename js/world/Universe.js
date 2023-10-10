const fs = require("fs");
const path = require("path");
const { EOL } = require("os");

const Reflection = require("../reflection/Reflection.js");
const World = require("./World.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const PIPE = "|";

class Universe {
    server;
    id;
    name;

    worlds = [];
    worldNameMap = new Map();
    worldIDMap = new Map();

    static loadUniverseFromFolder(server, className, universeFolder) {
        let universe = Reflection.createInstance(className);
        universe.server = server;

        let universeFile = path.join(universeFolder, "_universe.txt");
        let universeData = fs.readFileSync(universeFile, "ascii");
        let lines = universeData ? universeData.split(EOL) : [];

        // Each line represents a world within this universe.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the world id
            let idPart = parts.shift().split(COMMA);
            let id = Util.getStringOrNumber(idPart.shift());

            // Second part is the world class name
            let className = parts.shift();

            // Third part is the world name
            let name = parts.shift();

            let world = World.loadWorldFromFolder(universe, className, path.join(universeFolder, name));
            world.id = id;
            world.name = name;

            universe.addWorld(world);
        }

        return universe;
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