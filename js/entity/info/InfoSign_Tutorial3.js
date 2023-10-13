const Entity = require("../Entity.js");

class InfoSign_Tutorial3 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Tutorial: Click on anything to learn more about it.";
    }
}

module.exports = InfoSign_Tutorial3;