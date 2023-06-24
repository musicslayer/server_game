const DeathScreen = require("./DeathScreen.js");
const GameMap = require("./GameMap.js");

class DeathMap extends GameMap {
    getScreenByPosition(screenX, screenY) {
        // Always return a dynamically generated "death" screen.
        return this.createDeathScreen(screenX, screenY);
    }

    createDeathScreen(screenX, screenY) {
        let deathScreen = new DeathScreen();
        deathScreen.map = this;
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