class Tile {
    x;
    y;

    imageFolderArray;
    imageFileArray;

    constructor(imageFolderArray, imageFileArray) {
        this.imageFolderArray = imageFolderArray;
        this.imageFileArray = imageFileArray;
    }
}

module.exports = Tile;