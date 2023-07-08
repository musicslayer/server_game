class Tile {
    x;
    y;

    imageFolders;
    imageFiles;

    constructor(imageFolders, imageFiles) {
        this.imageFolders = imageFolders;
        this.imageFiles = imageFiles;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("x", this.x)
            .serialize("y", this.y)
            .serializeArray("imageFolders", this.imageFolders)
            .serializeArray("imageFiles", this.imageFiles)
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
            tile.imageFolders = reader.deserializeArray("imageFolders", "String");
            tile.imageFiles = reader.deserializeArray("imageFiles", "String");
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return tile;
    }
}

module.exports = Tile;