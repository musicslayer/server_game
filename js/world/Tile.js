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

    deserialize(s) {
        let j = JSON.parse(s);

        this.x = Number(j.x);
        this.y = Number(j.y);

        this.imageFolders = j.imageFolders;
        this.imageFiles = j.imageFiles;
    }
}

module.exports = Tile;