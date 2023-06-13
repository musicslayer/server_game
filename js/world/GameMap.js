const fs = require("fs");

const Screen = require("./Screen.js");

class GameMap {
    screens = [];
    screenMap = new Map();
    screenPosMap = new Map();

    static loadMapFromFolder(mapFolder) {
        let map = new GameMap();

        let files = fs.readdirSync(mapFolder);
        for(const file of files) {
            let screen = Screen.loadScreenFromFile(mapFolder + file);
            map.addScreen(file.split(".")[0], screen);
        }

        return map;
    }

    addScreen(name, screen) {
        this.screens.push(screen);
        this.screenMap.set(name, screen);

        let key = [screen.x, screen.y].join(",");
        this.screenPosMap.set(key, screen);
    }


    getScreenAbove(screen) {
        return this.getScreenByPosition(screen.x, screen.y - 1);
    }

    getScreenBelow(screen) {
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

        // If this screen does not exist, we return a special "void" screen.
        if(!screen) {
            screen = Screen.createVoidScreen(screenX, screenY);
        }
        
        return screen;
    }
}

module.exports = GameMap;