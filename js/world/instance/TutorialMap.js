const path = require("path");

const Screen = require("../Screen.js");
const DynamicMap = require("./DynamicMap.js");

class TutorialMap extends DynamicMap {
    getNamePrefix() {
        return "_tutorial_";
    }

    createDynamicScreen(screenX, screenY) {
        let tutorialScreen = Screen.loadScreenFromFile(this, "TutorialScreen", path.join(this.mapFolder, "tutorial.txt"));
        tutorialScreen.name = this.getNamePrefix() + [screenX, screenY].join(",");
        tutorialScreen.x = screenX;
        tutorialScreen.y = screenY;
        tutorialScreen.pvpStatus = "safe";

        this.addScreen(tutorialScreen);
        
        return tutorialScreen;
    }
}

module.exports = TutorialMap;