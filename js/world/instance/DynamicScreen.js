const InstanceScreen = require("./InstanceScreen.js");

class DynamicScreen extends InstanceScreen {
    // A dynamic screen is an instance screen where there is always another screen available in any direction.
    isDynamic = true;

    isScreenInDirection(direction) {
        return true;
    }
}

module.exports = DynamicScreen;