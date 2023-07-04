const Screen = require("./Screen.js");
const GameMap = require("./GameMap.js");

class DeathMap extends GameMap {
    getScreenByPosition(screenX, screenY) {
        // Always return a dynamically generated "death" screen.
        return this.createDeathScreen(this, screenX, screenY);
    }

    createDeathScreen(map, screenX, screenY) {
        let deathScreen = Screen.loadScreenFromFile("DeathScreen", this.mapFolder + "death.txt");
        deathScreen.map = map;
        deathScreen.name = "_death";
        deathScreen.x = screenX;
        deathScreen.y = screenY;
        deathScreen.pvpStatus = "safe";
        
        return deathScreen;
    }

    getMapInDirection(direction) {
        return this;
    }
}

module.exports = DeathMap;