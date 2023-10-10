const path = require("path");

const GameMap = require("../GameMap.js");
const GeneratorWorld = require("./GeneratorWorld.js");

class TutorialWorld extends GeneratorWorld {
    getNamePrefix() {
        return "_tutorial_";
    }

    getIDValue() {
        return "tutorial";
    }

    isIDAllowed(id) {
        return id === this.getIDValue();
    }

    createEntrance(world) {
        let tutorialMap = this.getMapByID(this.getIDValue());
        tutorialMap.world.removeMap(tutorialMap);
        tutorialMap.world = world;
        tutorialMap.world.addMap(tutorialMap);

        return {
            screen: tutorialMap.getScreenByID(0, 0),
            x: 7,
            y: 11
        }
    }

    teleportToEntrance(entity) {
        let entrance = this.createEntrance(entity.screen.map.world);
        entity.doTeleport(entrance.screen, entrance.x, entrance.y);
    }

    createMap(id) {
        let tutorialMap = GameMap.loadMapFromFolder(this, "TutorialMap", path.join(this.worldFolder, "_tutorial"))
        tutorialMap.name = this.getNamePrefix() + id;
        tutorialMap.id = id;

        this.addMap(tutorialMap);
        
        return tutorialMap;
    }
}

module.exports = TutorialWorld;