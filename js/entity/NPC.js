const Entity = require("./Entity.js");

class NPC extends Entity {
    doInteract() {
        console.log("Hello from NPC!");
    }
}

module.exports = NPC;