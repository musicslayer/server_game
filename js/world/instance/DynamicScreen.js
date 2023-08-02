const InstanceScreen = require("./InstanceScreen.js");

class DynamicScreen extends InstanceScreen {
    isDynamic = true;

    isScreenInDirection(direction) {
        return true;
    }
}

module.exports = DynamicScreen;