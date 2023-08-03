const path = require("path");

const Screen = require("../Screen.js");
const DynamicMap = require("./DynamicMap.js");

const NAME_PREFIX = "_tutorial_";

class TutorialMap extends DynamicMap {
    getScreenByName(name) {
        // Return a dynamically generated "tutorial" screen if the name starts with the expected prefix.
        let tutorialScreen;

        if(name.startsWith(NAME_PREFIX)) {
            name = name.slice(NAME_PREFIX.length);
            let [screenX, screenY] = name.split(",");
            tutorialScreen = this.createTutorialScreen(Number(screenX), Number(screenY));
        }

        return tutorialScreen;
    }

    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated "tutorial" screen.
        return this.createTutorialScreen(screenX, screenY);
    }

    createTutorialScreen(screenX, screenY) {
        let tutorialScreen = Screen.loadScreenFromFile(this, "TutorialScreen", path.join(this.mapFolder, "tutorial.txt"));
        tutorialScreen.name = NAME_PREFIX + [screenX, screenY].join(",");
        tutorialScreen.x = screenX;
        tutorialScreen.y = screenY;
        tutorialScreen.pvpStatus = "safe";

        this.addScreen(tutorialScreen);
        
        return tutorialScreen;
    }
}

module.exports = TutorialMap;