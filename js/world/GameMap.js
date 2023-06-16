const fs = require("fs");

const Screen = require("./Screen.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class GameMap {
    world;

    screens = [];
    screenMap = new Map();
    screenPosMap = new Map();

    static loadMapFromFolder(mapFolder, world) {
        let map = new GameMap();
        map.world = world;

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

            let screen = Screen.loadScreenFromFile(mapFolder + screenName + ".txt", map);
            
            map.addScreen(screenName, screen, x, y);
        }

        return map;
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
            screen = Screen.createVoidScreen(this, screenX, screenY);
        }
        
        return screen;
    }
}

module.exports = GameMap;