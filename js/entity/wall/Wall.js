const Entity = require("../Entity.js");

class Wall extends Entity {
    getName() {
        return "Wall";
    }

    getImageName() {
        return "wall_wall";
    }

    getInfo() {
        return "An obstacle to all movement.";
    }

    isTangible = true;
    isActionBlocker = true;
}

module.exports = Wall;