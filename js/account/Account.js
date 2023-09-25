class Account {
    // The password is not stored directly, we only store a hash.
    username;
    hash;
    email;
    characterMap = new Map();

    constructor(username, hash, email) {
        this.username = username;
        this.hash = hash;
        this.email = email;
    }

    addCharacter(name, player) {
        this.characterMap.set(name, player);
    }

    getCharacter(name) {
        return this.characterMap.get(name);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("username", this.username)
            .serialize("hash", this.hash)
            .serialize("email", this.email)
            .serializeMap("characterMap", this.characterMap)
        .endObject();
    }

    static deserialize(reader) {
        let account;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let username = reader.deserialize("username", "String");
            let hash = reader.deserialize("hash", "String");
            let email = reader.deserialize("email", "String");

            account = new Account(username, hash, email);
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