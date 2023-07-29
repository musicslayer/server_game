class UID {
    // Subclasses can call this constructor to store a map of uids to facilitate referencing and dereferencing.
    static uidMap = new Map();

    uid;

    static reset() {
        UID.uidMap = new Map();
    }

    static getValues(name) {
        let arr = [];

        let map = UID.uidMap.get(name);
        for(let key of map.keys()) {
            if(key === "currentUID") {
                continue;
            }

            arr.push(map.get(key));
        }

        return arr;
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