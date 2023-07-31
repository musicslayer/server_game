const Screen = require("./Screen.js");
const GameMap = require("./GameMap.js");

const NAME_PREFIX = "_void_";

class VoidMap extends GameMap {
    getScreenByName(name) {
        // Return a dynamically generated "void" screen is the name starts with the expected prefix.
        let screen;

        if(name.startsWith(NAME_PREFIX)) {
            name = name.slice(NAME_PREFIX.length);
            let [screenX, screenY] = name.split(",");
            screen = this.createVoidScreen(screenX, screenY);
        }

        return screen;
    }

    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated "void" screen.
        return this.createVoidScreen(screenX, screenY);
    }

    createVoidScreen(screenX, screenY) {
        let voidScreen = Screen.loadScreenFromFile("VoidScreen", this.mapFolder + "void.txt");
        voidScreen.map = this;
        voidScreen.name = NAME_PREFIX + [screenX, screenY].join(",");
        voidScreen.x = screenX;
        voidScreen.y = screenY;
        voidScreen.pvpStatus = "safe";
        
        return voidScreen;
    }

    createVoidMapClone(id) {
        // Creates a clone of this VoidMap with the specified ID.
        let voidMap = GameMap.loadMapFromFolder("VoidMap", this.mapFolder)
        voidMap.world = this.world;
        voidMap.id = id;
        voidMap.name = this.name;

        return voidMap;
    }
}

module.exports = VoidMap;