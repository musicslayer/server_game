class Character {
    player;

    constructor(player) {
        this.player = player;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .reference("player", this.player)
        .endObject();
    }

    static deserialize(reader) {
        let character;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let player = reader.dereference("player", "Entity");
            character = new Character(player);
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return character;
    }
}

module.exports = Character;