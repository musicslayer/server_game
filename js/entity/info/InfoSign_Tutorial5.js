const Entity = require("../Entity.js");

class InfoSign_Tutorial5 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Purse: Right click \"Gold\" icon to drop gold.";
    }
}

module.exports = InfoSign_Tutorial5;