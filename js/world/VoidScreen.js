const Screen = require("./Screen.js");

class VoidScreen extends Screen {
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

module.exports = VoidScreen;