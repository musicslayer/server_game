const fs = require("fs");

const Screen = require("./Screen.js");
const VoidScreen = require("./VoidScreen.js");
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

    loadMapFromFolder(mapFolder) {
        let mapData = fs.readFileSync(mapFolder + "_map.txt", "ascii");
        let lines = mapData ? mapData.split(CRLF) : [];

        // Each line represents a screen within this map.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the x,y
            let numPart = parts[0].split(COMMA);
            let x = Number(numPart.shift());
            let y = Number(numPart.shift());

            // Second part is the screen
            let name = parts[1];

            // Third part is whether the screen is safe or pvp
            let pvpStatus = parts[2];

            let screen = new Screen();
            screen.map = this;
            screen.name = name;
            screen.x = x;
            screen.y = y;
            screen.pvpStatus = pvpStatus;

            screen.loadScreenFromFile(mapFolder + name + ".txt");

            this.addScreen(screen);
        }
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
            screen = this.createVoidScreen(screenX, screenY);
        }
        
        return screen;
    }

    getMapInDirection(direction) {
        return this.world.getMapInDirection(this, direction);
    }

    createVoidScreen(screenX, screenY) {
        let voidScreen = new VoidScreen();
        voidScreen.map = this;
        voidScreen.x = screenX;
        voidScreen.y = screenY;

        voidScreen.loadScreenFromFile(this.world.voidMapFolder + "void.txt");
        
        return voidScreen;
    }
}

module.exports = GameMap;