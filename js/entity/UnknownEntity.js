const Entity = require("./Entity.js");

class UnknownEntity extends Entity {
    getEntityName() {
        return "?_?";
    }
}

module.exports = UnknownEntity;