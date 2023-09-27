class Character {
    name;
    player;

    constructor(name, player) {
        this.name = name;
        this.player = player;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .reference("name", this.name)
            .reference("player", this.player)
        .endObject();
    }

    static deserialize(reader) {
        let character;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let name = reader.dereference("name", "String");
            let player = reader.dereference("player", "Entity");
            character = new Character(name, player);
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return character;
    }
}

module.exports = Character;