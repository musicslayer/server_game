const path = require("path");

const GameMap = require("../GameMap.js");
const World = require("../World.js");

const NAME_PREFIX = "_tutorial_";
const ID_VALUE = "tutorial";

class TutorialWorld extends World {
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

    getMapByName(name) {
        // Return a dynamically generated "tutorial" map if the name starts with the expected prefix.
        let map;

        if(name.startsWith(NAME_PREFIX)) {
            // ID will always be a string.
            let id = name.slice(NAME_PREFIX.length);
            map = this.createTutorialMap(id);
        }

        return map;
    }

    getMapByID(id) {
        // Return a dynamically generated "tutorial" map if the id is the expected value.
        let map;

        if(id === ID_VALUE) {
            map = this.createTutorialMap(id);
        }

        return map;
    }

    createTutorialMap(id) {
        let tutorialMap = GameMap.loadMapFromFolder(this, "TutorialMap", path.join(this.worldFolder, "_tutorial"))
        tutorialMap.name = NAME_PREFIX + id;
        tutorialMap.id = id;

        this.addMap(tutorialMap);
        
        return tutorialMap;
    }
}

module.exports = TutorialWorld;