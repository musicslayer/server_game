const DeathScreen = require("./DeathScreen.js");
const GameMap = require("./GameMap.js");

class DeathMap extends GameMap {
    getScreenByPosition(screenX, screenY) {
        // Always return a dynamically generated "death" screen.
        return this.createDeathScreen(screenX, screenY);
    }

    createDeathScreen(screenX, screenY) {
        let deathScreen = new DeathScreen();
        deathScreen.attachMap(this);
        deathScreen.loadScreenFromFile(this.mapFolder + "death.txt");
        
        deathScreen.x = screenX;
        deathScreen.y = screenY;

        return deathScreen;
    }

    getMapUp() {
        return this;
    }

    getMapDown() {
        return this;
    }
}

module.exports = DeathMap;