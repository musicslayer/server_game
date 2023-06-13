const { loadImage } = require("canvas")
const fs = require("fs");

class ImageTable {
    imageMap = new Map();

    static async loadImageTableFromFolder(imageTableFolder) {
        let imageTable = new ImageTable();

        let files = fs.readdirSync(imageTableFolder);
        for(const file of files) {
            let image = await loadImage(imageTableFolder + file);
            imageTable.addImage(file.split(".")[0], image);
        }

        return imageTable;
    }

    addImage(name, image) {
        this.imageMap.set(name, image);
    }

    getImageByName(imageName) {
        return this.imageMap.get(imageName);
    }
}

module.exports = ImageTable;