class Tile {
    name;
    x;
    y;

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("name", this.name)
            .serialize("x", this.x)
            .serialize("y", this.y)
        .endObject();
    }

    static deserialize(reader) {
        let tile;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            tile = new Tile()
            tile.name = reader.deserialize("name", "String");
            tile.x = reader.deserialize("x", "Number");
            tile.y = reader.deserialize("y", "Number");
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return tile;
    }
}

module.exports = Tile;