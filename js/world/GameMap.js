const fs = require("fs");
const path = require("path");
const { EOL } = require("os");

const Reflection = require("../reflection/Reflection.js");
const Screen = require("./Screen.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const PIPE = "|";

class GameMap {
    world;
    id;
    name;

    screens = [];
    screenNameMap = new Map();
    screenIDMap = new Map();

    mapFolder;

    static loadMapFromFolder(world, className, mapFolder) {
        let map = Reflection.createInstance(className);
        map.world = world;
        map.mapFolder = mapFolder;

        let mapFile = path.join(mapFolder, "_map.txt");
        let mapData = fs.readFileSync(mapFile, "ascii");
        let lines = mapData ? mapData.split(EOL) : [];

        // Each line represents a screen within this map.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the x,y
            let numPart = parts.shift().split(COMMA);
            let x = Number(numPart.shift());
            let y = Number(numPart.shift());

            // Second part is the screen class name
            let className = parts.shift();

            // Third part is the screen name
            let name = parts.shift();

            // Fourth part is the background tile name
            let backgroundTileName = parts.shift();

            // Fifth part is whether the screen is safe or pvp
            let pvpStatus = parts.shift();

            let screen = Screen.loadScreenFromFile(map, className, path.join(mapFolder, name + ".txt"));
            screen.name = name;
            screen.x = x;
            screen.y = y;
            screen.pvpStatus = pvpStatus;
            screen.addBackgroundTile(backgroundTileName);

            map.addScreen(screen);
        }

        return map;
    }

    addScreen(screen) {
        this.screens.push(screen);
        this.screenNameMap.set(screen.name, screen);

        // The ID of a screen is made from its coordinates.
        let key = [screen.x, screen.y].join(",");
        this.screenIDMap.set(key, screen);
    }

    removeScreen(screen) {
        let index = this.screens.indexOf(screen);
        this.screens.splice(index, 1);

        this.screenNameMap.delete(screen.name);

        let key = [screen.x, screen.y].join(",");
        this.screenIDMap.delete(key);
    }

    isScreenInDirection(screen, direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        return this.isScreenByPosition(screen.x + shiftX, screen.y + shiftY);
    }


    isScreenByPosition(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        return this.screenIDMap.has(key);
    }

    getScreenInDirection(screen, direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        return this.getScreenByID(screen.x + shiftX, screen.y + shiftY);
    }

    getScreenByName(name) {
        let screen = this.screenNameMap.get(name);

        // If the screen does not exist in this map, try dynamically generating a "VoidScreen".
        // It's possible that the screen is still undefined. This occurs if the screen name used to exist but was later removed.
        if(!screen) {
            let voidWorld = this.world.universe.getWorldByID("void");
            let voidMap = voidWorld.getMapByID("void");

            screen = voidMap.getScreenByName(name);
            if(screen) {
                screen.map.removeScreen(screen);
                screen.map = this;
                screen.map.addScreen(screen);
            }
        }

        return screen;
    }

    getScreenByID(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        let screen = this.screenIDMap.get(key);

        // If the screen does not exist in this map, dynamically generate a "VoidScreen".
        if(!screen) {
            let voidWorld = this.world.universe.getWorldByID("void");
            let voidMap = voidWorld.getMapByID(0); // The ID doesn't matter.

            screen = voidMap.getScreenByID(screenX, screenY);
            screen.map.removeScreen(screen);
            screen.map = this;
            screen.map.addScreen(screen);
        }
        
        return screen;
    }

    getMapInDirection(direction) {
        return this.world.getMapInDirection(this, direction);
    }

    getPlayerCount() {
        let playerCount = 0;

        for(let screen of this.screens) {
            playerCount += screen.getPlayerCount();
        }

        return playerCount;
    }

    notifyPlayerRemoval() {
        // By default, do nothing.
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", Util.getClassName(this))
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serializeArray("screens", this.screens)
            .serialize("mapFolder", this.mapFolder)
        .endObject();
    }

    static deserialize(reader) {
        let map;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let className = reader.deserialize("className", "String");
            map = Reflection.createInstance(className);

            map.id = Util.getStringOrNumber(reader.deserialize("id", "String"));
            map.name = reader.deserialize("name", "String");
            let screens = reader.deserializeArray("screens", "Screen");
            map.mapFolder = reader.deserialize("mapFolder", "String");

            for(let screen of screens) {
                screen.map = map;
                map.addScreen(screen);
            }
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return map;
    }
}

module.exports = GameMap;