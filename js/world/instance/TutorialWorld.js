const path = require("path");

const GameMap = require("../GameMap.js");
const DynamicWorld = require("./DynamicWorld.js");

const NAME_PREFIX = "_tutorial_";
const ID_VALUE = "tutorial";

class TutorialWorld extends DynamicWorld {
    getNamePrefix() {
        return NAME_PREFIX;
    }

    isIDAllowed(id) {
        return id === ID_VALUE;
    }

    createEntrance(world) {
        let tutorialMap = this.getMapByID(ID_VALUE);
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

    createDynamicMap(id) {
        let tutorialMap = GameMap.loadMapFromFolder(this, "TutorialMap", path.join(this.worldFolder, "_tutorial"))
        tutorialMap.name = NAME_PREFIX + id;
        tutorialMap.id = id;

        this.addMap(tutorialMap);
        
        return tutorialMap;
    }
}

module.exports = TutorialWorld;