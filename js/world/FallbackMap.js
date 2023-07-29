const Screen = require("./Screen.js");
const GameMap = require("./GameMap.js");

class FallbackMap extends GameMap {
    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated "fallback" screen.
        return this.createFallbackScreen(this, screenX, screenY);
    }

    createFallbackScreen(map, screenX, screenY) {
        let fallbackScreen = Screen.loadScreenFromFile("FallbackScreen", this.mapFolder + "fallback.txt");
        fallbackScreen.map = map;
        fallbackScreen.name = "_fallback";
        fallbackScreen.x = screenX;
        fallbackScreen.y = screenY;
        fallbackScreen.pvpStatus = "safe";
        
        return fallbackScreen;
    }

    getMapInDirection(direction) {
        return this;
    }
}

module.exports = FallbackMap;