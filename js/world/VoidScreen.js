const Screen = require("./Screen.js");

class VoidScreen extends Screen {
    isDynamic = true;
    
    static createVoidScreen(screenX, screenY) {
        let voidScreen = new VoidScreen();
        voidScreen.loadScreenFromFile("assets/world/_dynamic/void.txt");

        voidScreen.x = screenX;
        voidScreen.y = screenY;

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