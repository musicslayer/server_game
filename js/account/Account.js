class Account {
    // The password is not stored directly, we only store a hash.
    username;
    hash;
    email;

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
            .serialize("username", this.username)
            .serialize("hash", this.hash)
            .serialize("email", this.email)
            .serializeArray("characters", this.characters)
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