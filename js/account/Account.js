class Account {
    key;
    characterMap = new Map();

    addCharacter(name, player) {
        this.characterMap.set(name, player);
    }

    getCharacter(name) {
        return this.characterMap.get(name);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("key", this.key)
            .serializeMap("characterMap", this.characterMap)
        .endObject();
    }

    static deserialize(reader) {
        let account;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            account = new Account();
            account.key = reader.deserialize("key", "String");
            account.characterMap = reader.deserializeMap("characterMap", "String", "Character");
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return account;
    }
}

module.exports = Account;