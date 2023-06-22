const Screen = require("./Screen.js");

class DeathScreen extends Screen {
    isDynamic = true;

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