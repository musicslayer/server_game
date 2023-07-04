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
            .serialize("x", this.x)
            .serialize("y", this.y)
            .serializeArray("imageFolders", this.imageFolders)
            .serializeArray("imageFiles", this.imageFiles)
        .endObject();
    }

    static deserialize(reader) {
        let tile = new Tile();

        reader.beginObject();
        let x = reader.deserialize("x", "Number");
        let y = reader.deserialize("y", "Number");
        let imageFolders = reader.deserializeArray("imageFolders", "String");
        let imageFiles = reader.deserializeArray("imageFiles", "String");
        reader.endObject();

        tile.x = x;
        tile.y = y;
        tile.imageFolders = imageFolders;
        tile.imageFiles = imageFiles;

        return tile;
    }
}

module.exports = Tile;