const Entity = require("../Entity.js");

class InfoSign_TutorialField1 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Did you forget how to play? Use this portal to return to the tutorial.";
    }
}

module.exports = InfoSign_TutorialField1;