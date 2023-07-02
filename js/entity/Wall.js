const Entity = require("./Entity.js");

class Wall extends Entity {
    getName() {
        return "Wall";
    }

    getInfo() {
        return "An obstacle to all movement.";
    }

    isTangible = true;
    isActionBlocker = true;
}

module.exports = Wall;