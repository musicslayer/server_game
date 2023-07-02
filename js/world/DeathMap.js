const DeathScreen = require("./DeathScreen.js");
const GameMap = require("./GameMap.js");

class DeathMap extends GameMap {
    getScreenByPosition(screenX, screenY) {
        // Always return a dynamically generated "death" screen.
        return this.createDeathScreen(this, screenX, screenY);
    }

    createDeathScreen(map, screenX, screenY) {
        let deathScreen = new DeathScreen();
        deathScreen.map = map;
        deathScreen.x = screenX;
        deathScreen.y = screenY;

        deathScreen.loadScreenFromFile(this.mapFolder + "death.txt");
        
        return deathScreen;
    }

    getMapInDirection(direction) {
        return this;
    }
}

module.exports = DeathMap;