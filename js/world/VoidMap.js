const GameMap = require("./GameMap.js");

class VoidMap extends GameMap {
    getScreenByPosition(screenX, screenY) {
        // Always return a dynamically generated "void" screen.
        return this.createVoidScreen(screenX, screenY);
    }
}

module.exports = VoidMap;