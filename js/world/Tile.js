class Tile {
    x;
    y;

    names;

    constructor(names) {
        this.names = names;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("x", this.x)
            .serialize("y", this.y)
            .serializeArray("names", this.names)
        .endObject();
    }

    static deserialize(reader) {
        let tile;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            tile = new Tile()
            tile.x = reader.deserialize("x", "Number");
            tile.y = reader.deserialize("y", "Number");
            tile.names = reader.deserializeArray("names", "String");
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return tile;
    }
}

module.exports = Tile;