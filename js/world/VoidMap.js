const Screen = require("./Screen.js");
const GameMap = require("./GameMap.js");

class VoidMap extends GameMap {
    getScreenByPosition(screenX, screenY) {
        // Always return a dynamically generated "void" screen.
        return this.createVoidScreen(this, screenX, screenY);
    }

    createVoidScreen(map, screenX, screenY) {
        let voidScreen = Screen.loadScreenFromFile("VoidScreen", this.mapFolder + "void.txt");
        voidScreen.map = map;
        voidScreen.name = "_void";
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