const Entity = require("./Entity.js");

class PVPToken extends Entity {
    id = "pvp_token";
    maxStackNumber = 1;
    maxStackSize = 10000;

    getName() {
        return "PVP Token";
    }

    getInfo() {
        return "A token rewarded for killing another player.";
    }

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
}

module.exports = PVPToken;