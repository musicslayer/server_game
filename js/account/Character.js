class Character {
    player;

    mapName;
    screenName;
    x;
    y;

    constructor(player) {
        this.player = player;

        // When a character is first constructed, the player's location is its home location.
        this.mapName = player.homeMapName;
        this.screenName = player.homeScreenName;
        this.x = player.homeX;
        this.y = player.homeY;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .reference("player", this.player)
            .serialize("mapName", this.mapName)
            .serialize("screenName", this.screenName)
            .serialize("x", this.x)
            .serialize("y", this.y)
        .endObject();
    }

    static deserialize(reader) {
        let character;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let player = reader.dereference("player", "Entity");
            character = new Character(player);
            
            character.mapName = reader.deserialize("mapName", "String");
            character.screenName = reader.deserialize("screenName", "String");
            character.x = reader.deserialize("x", "Number");
            character.y = reader.deserialize("y", "Number");
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return character;
    }
}

module.exports = Character;