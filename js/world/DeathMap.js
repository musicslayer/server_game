const Screen = require("./Screen.js");
const GameMap = require("./GameMap.js");

const NAME_PREFIX = "_death_";

class DeathMap extends GameMap {
    getScreenByName(name) {
        // Return a dynamically generated "death" screen is the name starts with the expected prefix.
        let screen;

        if(name.startsWith(NAME_PREFIX)) {
            name = name.slice(NAME_PREFIX.length);
            let [screenX, screenY] = name.split(",");
            screen = this.createDeathScreen(screenX, screenY);
        }

        return screen;
    }

    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated "death" screen.
        return this.createDeathScreen(screenX, screenY);
    }

    createDeathScreen(screenX, screenY) {
        let deathScreen = Screen.loadScreenFromFile("DeathScreen", this.mapFolder + "death.txt");
        deathScreen.map = this;
        deathScreen.name = NAME_PREFIX + [screenX, screenY].join(",");
        deathScreen.x = screenX;
        deathScreen.y = screenY;
        deathScreen.pvpStatus = "safe";
        
        return deathScreen;
    }

    getMapInDirection(direction) {
        return this;
    }
}

module.exports = DeathMap;