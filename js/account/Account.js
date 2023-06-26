class Account {
    characterMap = new Map();

    addCharacter(name, player) {
        this.characterMap.set(name, player);
    }

    getCharacter(name) {
        return this.characterMap.get(name);
    }

    serialize() {
        let s = "{";
        s += "\"characterMap\":";
        s += "{";

        // Serialize the map as one array of keys and one array of values.
        // Do a manual iteration to make sure that keys and values are in the correct order.
        let keyArray = [];
        let valueArray = [];
        for(let key of this.characterMap.keys()) {
            keyArray.push(key);
            valueArray.push(this.characterMap.get(key));
        }

        s += "\"keys\":";
        s += "[";
        for(let key of keyArray) {
            s += "\"" + key + "\"";
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += ",";
        s += "\"values\":";
        s += "[";
        for(let value of valueArray) {
            s += value.serialize();
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += "}";
        s += "}";

        return s;
    }

    deserialize(s, server) {
        let j = JSON.parse(s);

        this.characterMap = new Map();
        for(let i = 0; i < j.characterMap.keys.length; i++) {
            let key = j.characterMap.keys[i];
            let value_s = JSON.stringify(j.characterMap.values[i]);

            let player_j = j.characterMap.values[i];
            let player = server.galaxy.worlds[0].createInstance(player_j.id, Number(player_j.stackSize));
            //player.deserialize(value_s);

            this.characterMap.set(key, player);
        }
    }
}

module.exports = Account;