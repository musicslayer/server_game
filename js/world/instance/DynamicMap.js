const InstanceMap = require("./InstanceMap.js");

class DynamicMap extends InstanceMap {
    // A dynamic map is a map used to generate dynamic screens.
    isDynamic = true;
}

module.exports = DynamicMap;