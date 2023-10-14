const Entity = require("../Entity.js");

class InfoSign extends Entity {
    infoText;

    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return this.infoText;
    }
}

module.exports = InfoSign;