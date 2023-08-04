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