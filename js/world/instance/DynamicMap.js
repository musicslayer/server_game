const InstanceMap = require("./InstanceMap.js");

class DynamicMap extends InstanceMap {
    // A dynamic map is a map used to generate dynamic screens.
    isDynamic = true;

    getScreenByName(name) {
        // Return a dynamically generated screen if the name starts with the expected prefix.
        let screen;

        let prefix = this.getNamePrefix();
        if(name.startsWith(prefix)) {
            name = name.slice(prefix.length);
            let [screenX, screenY] = name.split(",");
            screen = this.createDynamicScreen(Number(screenX), Number(screenY));
        }

        return screen;
    }

    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated screen.
        return this.createDynamicScreen(screenX, screenY);
    }
}

module.exports = DynamicMap;