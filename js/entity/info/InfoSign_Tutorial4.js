const Entity = require("../Entity.js");

class InfoSign_Tutorial4 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Inventory: Right click to use an item, left click drag to move items or drop them onto the screen.";
    }
}

module.exports = InfoSign_Tutorial4;