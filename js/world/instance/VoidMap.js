const path = require("path");

const Screen = require("../Screen.js");
const DynamicMap = require("./DynamicMap.js");

class VoidMap extends DynamicMap {
    getNamePrefix() {
        return "_void_";
    }

    createDynamicScreen(screenX, screenY) {
        let voidScreen = Screen.loadScreenFromFile(this, "VoidScreen", path.join(this.mapFolder, "void.txt"));
        voidScreen.name = this.getNamePrefix() + [screenX, screenY].join(",");
        voidScreen.x = screenX;
        voidScreen.y = screenY;
        voidScreen.pvpStatus = "safe";

        this.addScreen(voidScreen);
        
        return voidScreen;
    }
}

module.exports = VoidMap;