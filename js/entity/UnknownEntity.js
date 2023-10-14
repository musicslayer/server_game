const Entity = require("./Entity.js");

class UnknownEntity extends Entity {
    getImageName() {
        return "?_?";
    }
}

module.exports = UnknownEntity;