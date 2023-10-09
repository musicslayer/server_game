const InstanceScreen = require("./InstanceScreen.js");

class DynamicScreen extends InstanceScreen {
    // A dynamic screen is an instance screen where there is always another screen available in any direction.
    isScreenInDirection(direction) {
        return true;
    }

    allowsItemUse() {
        // To avoid confusion, do not allow players to drop or consume items on dynamic screens.
        return false;
    }
}

module.exports = DynamicScreen;