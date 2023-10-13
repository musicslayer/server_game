const Entity = require("../Entity.js");

class InfoSign_DangerField2 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Can you reach the end and claim the prize?";
    }
}

module.exports = InfoSign_DangerField2;