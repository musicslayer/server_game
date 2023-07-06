const Screen = require("./Screen.js");

class DeathScreen extends Screen {
    isDynamic = true;

    isScreenInDirection(direction) {
        return true;
    }
}

module.exports = DeathScreen;