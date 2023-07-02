const fs = require("fs");

const WorldFactory = require("./WorldFactory.js");
const Screen = require("./Screen.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class GameMap {
    world;
    id;
    name;

    screens = [];
    screenMap = new Map();
    screenPosMap = new Map();

    mapFolder;

    static loadMapFromFolder(className, mapFolder) {
        let map = WorldFactory.createInstance(className);
        map.mapFolder = mapFolder;

        let mapData = fs.readFileSync(mapFolder + "_map.txt", "ascii");
        let lines = mapData ? mapData.split(CRLF) : [];

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

            // Fourth part is whether the screen is safe or pvp
            let pvpStatus = parts.shift();

            let screen = Screen.loadScreenFromFile(className, mapFolder + name + ".txt");
            screen.map = map;
            screen.name = name;
            screen.x = x;
            screen.y = y;
            screen.pvpStatus = pvpStatus;

            map.addScreen(screen);
        }

        return map;
    }

    addScreen(screen) {
        this.screens.push(screen);
        this.screenMap.set(screen.name, screen);

        let key = [screen.x, screen.y].join(",");
        this.screenPosMap.set(key, screen);
    }

    getScreenByName(name) {
        return this.screenMap.get(name);
    }

    isScreenInDirection(screen, direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        return this.isScreenByPosition(screen.x + shiftX, screen.y + shiftY);
    }


    isScreenByPosition(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        return this.screenPosMap.has(key);
    }

    getScreenInDirection(screen, direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        return this.getScreenByPosition(screen.x + shiftX, screen.y + shiftY);
    }

    getScreenByPosition(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        let screen = this.screenPosMap.get(key);

        // If this screen does not exist, return a dynamically generated "void" screen.
        if(!screen) {
            let voidMap = this.world.getMapByPosition("void");
            screen = voidMap.createVoidScreen(this, screenX, screenY)
        }
        
        return screen;
    }

    getMapInDirection(direction) {
        return this.world.getMapInDirection(this, direction);
    }

    serialize() {
        let s = "{";
        s += "\"classname\":";
        s += "\"" + this.constructor.name + "\"";
        s += ",";
        s += "\"id\":";
        s += "\"" + this.id + "\"";
        s += ",";
        s += "\"name\":";
        s += "\"" + this.name + "\"";
        s += ",";
        s += "\"screens\":";
        s += "[";
        for(let screen of this.screens) {
            s += screen.serialize();
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += "}";

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);

        this.id = j.id;
        this.name = j.name;
        
        for(let screen_j of j.screens) {
            let screen_s = JSON.stringify(screen_j);

            let screen = new Screen();
            screen.map = this;

            screen.deserialize(screen_s);
            this.addScreen(screen);
        }
    }
}

module.exports = GameMap;