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
            .serialize("key", this.key)
            .serializeMap("characterMap", this.characterMap)
        .endObject();
    }

    static deserialize(reader) {
        let account = new Account();

        reader.beginObject();
        let key = reader.deserialize("key", "String");
        let characterMap = reader.deserializeMap("characterMap", "String", "Entity");
        reader.endObject();

        account.key = key;
        account.characterMap = characterMap;

        return account;
    }
}

module.exports = Account;