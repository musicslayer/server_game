const path = require("path");

const Screen = require("./Screen.js");
const GameMap = require("./GameMap.js");

const NAME_PREFIX = "_death_";

class DeathMap extends GameMap {
    getScreenByName(name) {
        // Return a dynamically generated "death" screen if the name starts with the expected prefix.
        let deathScreen;

        if(name.startsWith(NAME_PREFIX)) {
            name = name.slice(NAME_PREFIX.length);
            let [screenX, screenY] = name.split(",");
            deathScreen = this.createDeathScreen(Number(screenX), Number(screenY));
        }

        return deathScreen;
    }

    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated "death" screen.
        return this.createDeathScreen(screenX, screenY);
    }

    createDeathScreen(screenX, screenY) {
        let deathScreen = Screen.loadScreenFromFile("DeathScreen", path.join(this.mapFolder, "death.txt"));
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