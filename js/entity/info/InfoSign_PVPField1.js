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
        return "Watch out! Players can kill each other on this map.";
    }
}

module.exports = InfoSign_StartField1;