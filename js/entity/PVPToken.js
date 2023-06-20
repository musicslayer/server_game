const Entity = require("./Entity.js");

class PVPToken extends Entity {
    id = "pvp_token";
    maxStackNumber = 1;
    maxStackSize = 10000;

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            entity.doAddToInventory(this);
        }
    }

    canConsume(entity) {
        // These can only be traded, not consumed.
        return false;
    }

    doConsume(entity) {
        entity.addHealth(this.healthReward);
    }
}

module.exports = PVPToken;