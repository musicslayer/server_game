const Entity = require("./Entity.js");

class Wall extends Entity {
    id = "wall";

    isTangible = true;
    blocksMovement = true;
    blocksAction = true;
}

module.exports = Wall;