const Screen = require("./Screen.js");
const GameMap = require("./GameMap.js");

const NAME_PREFIX = "_fallback_";

class FallbackMap extends GameMap {
    getScreenByName(name) {
        // Return a dynamically generated "fallback" screen is the name starts with the expected prefix.
        let screen;

        if(name.startsWith(NAME_PREFIX)) {
            name = name.slice(NAME_PREFIX.length);
            let [screenX, screenY] = name.split(",");
            screen = this.createFallbackScreen(screenX, screenY);
        }

        return screen;
    }

    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated "fallback" screen.
        return this.createFallbackScreen(screenX, screenY);
    }

    createFallbackScreen(screenX, screenY) {
        let fallbackScreen = Screen.loadScreenFromFile("FallbackScreen", this.mapFolder + "fallback.txt");
        fallbackScreen.map = this;
        fallbackScreen.name = NAME_PREFIX + [screenX, screenY].join(",");
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