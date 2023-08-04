const DataBridge = require("../data/DataBridge.js");

// A list of all of the names of maps this class will manage.
// Note that the name of a map must be a base class of all the objects stored in it.
const MAP_NAMES = ["Entity"]

class UID {
    // Subclasses will have all instances stored in a singleton map to facilitate referencing and dereferencing.
    static uidMap = new Map();
    static currentUIDMap = new Map();

    uid;

    static init() {
        for(let name of MAP_NAMES) {
            UID.uidMap.set(name, new Map());
            UID.currentUIDMap.set(name, 0);
        }
    }

    static serialize(fileBase) {
        DataBridge.serializeMap(fileBase + "_currentUIDMap.txt", UID.currentUIDMap);
        for(let name of MAP_NAMES) {
            DataBridge.serializeMap(fileBase + "_map_" + name + ".txt", UID.uidMap.get(name));
        }
    }

    static deserialize(fileBase) {
        UID.currentUIDMap = DataBridge.deserializeMap(fileBase + "_currentUIDMap.txt", "String", "Number");
        for(let name of MAP_NAMES) {
            UID.uidMap.set(name, DataBridge.deserializeMap(fileBase + "_map_" + name + ".txt", "Number", name))
        }
    }

    constructor(uid) {
        if(uid !== undefined) {
            // This is not a brand new object (i.e. it's being loaded), so return it without altering any of the static maps.
            this.uid = uid;
            return;
        }

        let name = this.getUIDMapName();

        let currentUID = UID.currentUIDMap.get(name);
        this.uid = currentUID;
        UID.currentUIDMap.set(name, currentUID + 1);

        this.add();
    }

    add() {
        let map = UID.uidMap.get(this.getUIDMapName());
        map.set(this.uid, this);
    }

    remove() {
        let map = UID.uidMap.get(this.getUIDMapName());
        map.delete(this.uid);
    }

    reference(writer) {
        writer.beginObject()
            .serialize("mapName", this.getUIDMapName())
            .serialize("uid", this.uid)
        .endObject();
    }

    static dereference(reader) {
        reader.beginObject();
        let mapName = reader.deserialize("mapName", "String");
        let uid = reader.deserialize("uid", "Number");
        reader.endObject();

        let map = UID.uidMap.get(mapName);
        return map.get(uid);
    }
}

module.exports = UID;