const DeathScreen = require("./DeathScreen.js");
const GameMap = require("./GameMap.js");

class DeathMap extends GameMap {
    isDynamic = true;
    
    static createDeathMap() {
        return new DeathMap();
    }

    getScreenByPosition(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        let screen = this.screenPosMap.get(key);

        // If this screen does not exist, return a dynamically generated "death" screen.
        if(!screen) {
            screen = DeathScreen.createDeathScreen(screenX, screenY);
            screen.attachMap(this);
        }
        
        return screen;
    }
}

module.exports = DeathMap;