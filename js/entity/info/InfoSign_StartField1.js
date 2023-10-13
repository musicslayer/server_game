const Entity = require("../Entity.js");

class InfoSign_StartField1 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Welcome! Walk around and explore the city.";
    }
}

module.exports = InfoSign_StartField1;