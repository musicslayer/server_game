const Screen = require("./Screen.js");

class VoidScreen extends Screen {
    isDynamic = true;
    
    isScreenInDirection(direction) {
        return true;
    }
}

module.exports = VoidScreen;