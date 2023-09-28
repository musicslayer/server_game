class Account {
    isEnabled = true;

    username;
    hash; // The password is not stored directly, we only store a hash.
    email;

    lastServerName;
    lastWorldName;
    lastCharacterName;

    characters = [];
    characterMap = new Map();

    constructor(username, hash, email) {
        this.username = username;
        this.hash = hash;
        this.email = email;
    }

    addCharacter(character) {
        this.characters.push(character);
        this.characterMap.set(character.name, character);
    }

    removeCharacter(character) {
        let index = this.characters.indexOf(character);
        this.characters.splice(index, 1);
        this.characterMap.delete(character.name);
    }

    getCharacter(name) {
        return this.characterMap.get(name);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("isEnabled", this.isEnabled)
            .serialize("username", this.username)
            .serialize("hash", this.hash)
            .serialize("email", this.email)
            .serialize("lastServerName", this.lastServerName)
            .serialize("lastWorldName", this.lastWorldName)
            .serialize("lastCharacterName", this.lastCharacterName)
            .serializeArray("characters", this.characters)
        .endObject();
    }

    static deserialize(reader) {
        let account;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let isEnabled = reader.deserialize("isEnabled", "Boolean");
            let username = reader.deserialize("username", "String");
            let hash = reader.deserialize("hash", "String");
            let email = reader.deserialize("email", "String");
            let lastServerName = reader.deserialize("lastServerName", "String");
            let lastWorldName = reader.deserialize("lastWorldName", "String");
            let lastCharacterName = reader.deserialize("lastCharacterName", "String");

            account = new Account(username, hash, email);
            account.isEnabled = isEnabled;
            account.lastServerName = lastServerName;
            account.lastWorldName = lastWorldName;
            account.lastCharacterName = lastCharacterName;

            let characters = reader.deserializeArray("characters", "Character");
            for(let character of characters) {
                account.addCharacter(character);
            }
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return account;
    }
}

module.exports = Account;