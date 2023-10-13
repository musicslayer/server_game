const Entity = require("../Entity.js");

class InfoSign_DangerField1 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Kill monsters to earn gold.";
    }
}

module.exports = InfoSign_DangerField1;