class Character {
    name;
    className;
    player;

    constructor(name, className, player) {
        this.name = name;
        this.className = className;
        this.player = player;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("name", this.name)
            .serialize("className", this.className)
            .reference("player", this.player)
        .endObject();
    }

    static deserialize(reader) {
        let character;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let name = reader.deserialize("name", "String");
            let className = reader.deserialize("className", "String");
            let player = reader.dereference("player", "Entity");
            character = new Character(name, className, player);
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return character;
    }
}

module.exports = Character;