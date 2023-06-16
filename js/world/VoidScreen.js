const Screen = require("./Screen.js");

class VoidScreen extends Screen {
    static createVoidScreen(screenX, screenY) {
        let voidScreen = VoidScreen.fromScreen(Screen.loadScreenFromFile("assets/world/_dynamic/void.txt"));
        voidScreen.x = screenX;
        voidScreen.y = screenY;

        return voidScreen;
    }

    static fromScreen(screen) {
        let voidScreen = new VoidScreen();
        voidScreen.map = screen.map;
        voidScreen.x = screen.x;
        voidScreen.y = screen.y;
        voidScreen.numTilesX = screen.numTilesX;
        voidScreen.numTilesY = screen.numTilesY;
        voidScreen.tiles = screen.tiles;
        voidScreen.entities = screen.entities;
        return voidScreen;
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

module.exports = VoidScreen;