const Entity = require("./Entity.js");

class Wall extends Entity {
    id = "wall";

    getName() {
        return "Wall";
    }

    getInfo() {
        return "An obstacle to all movement.";
    }

    isTangible = true;
    blocksMovement = true;
    blocksAction = true;
}

module.exports = Wall;