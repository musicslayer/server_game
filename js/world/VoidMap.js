const path = require("path");

const Screen = require("./Screen.js");
const GameMap = require("./GameMap.js");

const NAME_PREFIX = "_void_";

class VoidMap extends GameMap {
    getScreenByName(name) {
        // Return a dynamically generated "void" screen if the name starts with the expected prefix.
        let screen;

        if(name.startsWith(NAME_PREFIX)) {
            name = name.slice(NAME_PREFIX.length);
            let [screenX, screenY] = name.split(",");
            screen = this.createVoidScreen(Number(screenX), Number(screenY));
        }

        return screen;
    }

    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated "void" screen.
        return this.createVoidScreen(screenX, screenY);
    }

    createVoidScreen(screenX, screenY) {
        let voidScreen = Screen.loadScreenFromFile(this, "VoidScreen", path.join(this.mapFolder, "void.txt"));
        voidScreen.name = NAME_PREFIX + [screenX, screenY].join(",");
        voidScreen.x = screenX;
        voidScreen.y = screenY;
        voidScreen.pvpStatus = "safe";

        this.instanceScreens.push(voidScreen);
        
        return voidScreen;
    }
}

module.exports = VoidMap;