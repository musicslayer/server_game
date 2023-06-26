class Tile {
    x;
    y;

    imageFolders;
    imageFiles;

    constructor(imageFolders, imageFiles) {
        this.imageFolders = imageFolders;
        this.imageFiles = imageFiles;
    }

    serialize() {
        let s = "{";
        s += "\"x\":";
        s += "\"" + this.x + "\"";
        s += ",";
        s += "\"y\":";
        s += "\"" + this.y + "\"";
        s += ",";
        s += "\"imageFolders\":";
        s += "[";
        for(let imageFolder of this.imageFolders) {
            s += "\"" + imageFolder + "\"";
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += ",";
        s += "\"imageFiles\":";
        s += "[";
        for(let imageFile of this.imageFiles) {
            s += "\"" + imageFile + "\"";
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += "}";

        return s;
    }

    static deserialize(s) {
        let j = JSON.parse(s);

        let tile = new Tile();
        tile.x = Number(j.x);
        tile.y = Number(j.y);

        tile.imageFolders = j.imageFolders;
        tile.imageFiles = j.imageFiles;

        return tile;
    }
}

module.exports = Tile;