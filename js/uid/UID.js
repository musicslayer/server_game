class UID {
    // Subclasses will have all instances stored in a singleton map to facilitate referencing and dereferencing.
    static uidMap = new Map();
    static currentUIDMap = new Map();

    uid;

    // TODO We need an add method?
    static remove(name, obj) {
        let map = UID.uidMap.get(name);
        map.delete(obj.uid);
    }

    constructor(uid) {
        let key = this.getUIDMapName();

        let map = UID.uidMap.get(key);
        if(map === undefined) {
            map = new Map();
            UID.currentUIDMap.set(key, 0);
        }

        if(uid !== undefined) {
            this.uid = uid;
        }
        else {
            let currentUID = UID.currentUIDMap.get(key);
            this.uid = currentUID;
            UID.currentUIDMap.set(key, currentUID + 1);
        }

        map.set(this.uid, this);
        UID.uidMap.set(key, map);
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