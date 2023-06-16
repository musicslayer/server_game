const Screen = require("./Screen.js");

class DeathScreen extends Screen {
    static createDeathScreen(screenX, screenY) {
        let deathScreen = DeathScreen.fromScreen(Screen.loadScreenFromFile("assets/world/_dynamic/death.txt"));
        deathScreen.x = screenX;
        deathScreen.y = screenY;

        return deathScreen;
    }

    static fromScreen(screen) {
        let deathScreen = new DeathScreen();
        deathScreen.map = screen.map;
        deathScreen.x = screen.x;
        deathScreen.y = screen.y;
        deathScreen.numTilesX = screen.numTilesX;
        deathScreen.numTilesY = screen.numTilesY;
        deathScreen.tiles = screen.tiles;
        deathScreen.entities = screen.entities;
        return deathScreen;
    }

    isScreenUp() {
        return true;
    }

    isScreenDown() {
        return true;
    }

    isScreenLeft() {
        return true;
    }

    isScreenRight() {
        return true;
    }
}

module.exports = DeathScreen;