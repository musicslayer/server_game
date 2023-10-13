const path = require("path");

const Screen = require("../Screen.js");
const DynamicMap = require("./DynamicMap.js");

class FallbackMap extends DynamicMap {
    getNamePrefix() {
        return "_fallback_";
    }

    createDynamicScreen(screenX, screenY) {
        let fallbackScreen = Screen.loadScreenFromFile(this, "DynamicScreen", path.join(this.mapFolder, "fallback.txt"));
        fallbackScreen.name = this.getNamePrefix() + [screenX, screenY].join(",");
        fallbackScreen.displayName = "Fallback Screen";
        fallbackScreen.x = screenX;
        fallbackScreen.y = screenY;
        fallbackScreen.pvpStatus = "safe";
        fallbackScreen.addBackgroundTile("terrain_grasspurple");

        this.addScreen(fallbackScreen);
        
        return fallbackScreen;
    }
}

module.exports = FallbackMap;