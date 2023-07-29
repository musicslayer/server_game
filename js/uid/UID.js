class UID {
    // Subclasses can call this constructor to store a map of uids to facilitate referencing and dereferencing.
    static uidMap = new Map();

    uid;

    static reset() {
        UID.uidMap = new Map();
    }

    constructor(uid) {
        let key = this.getUIDMapName();

        let map = UID.uidMap.get(key);
        if(map === undefined) {
            map = new Map();
            map.set("currentUID", 0);
        }

        if(uid) {
            this.uid = uid;
        }
        else {
            let currentUID = map.get("currentUID");
            this.uid = currentUID;
            map.set("currentUID", currentUID + 1);
        }

        map.set(this.uid, this);
        UID.uidMap.set(key, map);
    }

    reference(writer) {
        writer.beginObject()
            .serialize("className", this.getUIDMapName())
            .serialize("uid", this.uid)
        .endObject();
    }

    static dereference(reader) {
        reader.beginObject();
        let className = reader.deserialize("className", "String");
        let uid = reader.deserialize("uid", "Number");
        reader.endObject();

        let map = UID.uidMap.get(className);
        return map.get(uid);
    }
}

module.exports = UID;