class UID {
    // Subclasses will have all instances stored in a singleton map to facilitate referencing and dereferencing.
    static uidMap = new Map();
    static currentUIDMap = new Map();

    uid;

    constructor(uid) {
        let name = this.getUIDMapName();

        let map = UID.uidMap.get(name);
        if(map === undefined) {
            map = new Map();
            UID.uidMap.set(name, map);
            UID.currentUIDMap.set(name, 0);
        }

        if(uid === undefined) {
            let currentUID = UID.currentUIDMap.get(name);
            this.uid = currentUID;
            UID.currentUIDMap.set(name, currentUID + 1);
        }
        else {
            this.uid = uid;
        }

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