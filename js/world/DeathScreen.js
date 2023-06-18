const Screen = require("./Screen.js");

class DeathScreen extends Screen {
    isDynamic = true;

    static createDeathScreen(screenX, screenY) {
        let deathScreen = new DeathScreen();
        deathScreen.loadScreenFromFile("assets/world/_dynamic/death.txt");

        deathScreen.x = screenX;
        deathScreen.y = screenY;

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