const fs = require("fs");

const Screen = require("./Screen.js");
const VoidScreen = require("./VoidScreen.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class GameMap {
    world;

    screens = [];
    screenMap = new Map();
    screenPosMap = new Map();

    loadMapFromFolder(mapFolder) {
        let screenData = fs.readFileSync(mapFolder + "_map.txt", "ascii");
        let lines = screenData.split(CRLF);

        // Each line represents a screen within this map.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the x,y
            let numPart = parts[0].split(COMMA);
            let x = Number(numPart.shift());
            let y = Number(numPart.shift());

            // Second part is the screen
            let screenName = parts[1];

            let screen = new Screen();
            screen.loadScreenFromFile(mapFolder + screenName + ".txt");
            
            screen.attachMap(this);
            this.addScreen(screenName, screen, x, y);
        }
    }

    attachWorld(world) {
        this.world = world;
    }

    addScreen(name, screen, x, y) {
        screen.x = x;
        screen.y = y;

        this.screens.push(screen);
        this.screenMap.set(name, screen);

        let key = [x, y].join(",");
        this.screenPosMap.set(key, screen);
    }

    getScreen(name) {
        return this.screenMap.get(name);
    }

    isScreenUp(screen) {
        return this.isScreenByPosition(screen.x, screen.y - 1);
    }

    isScreenDown(screen) {
        return this.isScreenByPosition(screen.x, screen.y + 1);
    }

    isScreenLeft(screen) {
        return this.isScreenByPosition(screen.x - 1, screen.y);
    }

    isScreenRight(screen) {
        return this.isScreenByPosition(screen.x + 1, screen.y);
    }

    isScreenByPosition(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        let screen = this.screenPosMap.get(key);
        return screen !== undefined;
    }

    getScreenUp(screen) {
        return this.getScreenByPosition(screen.x, screen.y - 1);
    }

    getScreenDown(screen) {
        return this.getScreenByPosition(screen.x, screen.y + 1);
    }

    getScreenLeft(screen) {
        return this.getScreenByPosition(screen.x - 1, screen.y);
    }

    getScreenRight(screen) {
        return this.getScreenByPosition(screen.x + 1, screen.y);
    }

    getScreenByPosition(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        let screen = this.screenPosMap.get(key);

        // If this screen does not exist, return a dynamically generated "void" screen.
        if(!screen) {
            screen = VoidScreen.createVoidScreen(screenX, screenY);
            screen.attachMap(this);
        }
        
        return screen;
    }

    getMapUp() {
        return this.world?.getMapUp(this);
    }

    getMapDown() {
        return this.world?.getMapDown(this);
    }
}

module.exports = GameMap;