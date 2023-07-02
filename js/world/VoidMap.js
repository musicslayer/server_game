const VoidScreen = require("./VoidScreen.js");
const GameMap = require("./GameMap.js");

class VoidMap extends GameMap {
    getScreenByPosition(screenX, screenY) {
        // Always return a dynamically generated "void" screen.
        return this.createVoidScreen(this, screenX, screenY);
    }

    createVoidScreen(map, screenX, screenY) {
        let voidScreen = new VoidScreen();
        voidScreen.map = map;
        voidScreen.x = screenX;
        voidScreen.y = screenY;

        voidScreen.loadScreenFromFile(this.mapFolder + "void.txt");
        
        return voidScreen;
    }

    createVoidMapClone(id) {
        // Creates a clone of this VoidMap with the specified ID.
        let voidMap = new VoidMap();
        voidMap.world = this.world;
        voidMap.id = id;
        voidMap.name = this.name;

        voidMap.loadMapFromFolder(this.mapFolder)

        return voidMap;
    }
}

module.exports = VoidMap;