const Entity = require("./Entity.js");

class Wall extends Entity {
    doInteract() {
        console.log("Bump!");
    }
}

module.exports = Wall;