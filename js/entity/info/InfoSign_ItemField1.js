const Entity = require("../Entity.js");

class InfoSign_ItemField1 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Enjoy a variety of items.";
    }
}

module.exports = InfoSign_ItemField1;