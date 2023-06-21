const Entity = require("./Entity.js");

class Gold extends Entity {
    id = "gold";
    maxStackSize = 100000;

    getName() {
        return "Gold";
    }

    getInfo() {
        return "Currency that can be exchanged for goods and services.";
    }

    doInteract(entity) {
        // Gold is stored in the purse instead of the inventory.
        if(entity.purse) {
            entity.doAddToPurse(this);
        }
    }
}

module.exports = Gold;