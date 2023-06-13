const fs = require("fs");

const ImageTable = require("./ImageTable.js");

class ImageCatalog {
    static IMAGE_CATALOG;

    imageTableMap = new Map();

    static async loadImageCatalogFromFolder(imageFolder) {
        let imageCatalog = new ImageCatalog();

        let imageTableFolders = fs.readdirSync(imageFolder);
        for(const imageTableFolder of imageTableFolders) {
            let imageTable = await ImageTable.loadImageTableFromFolder(imageFolder + imageTableFolder + "/");
            imageCatalog.addImageTable(imageTableFolder, imageTable);
        }

        ImageCatalog.IMAGE_CATALOG = imageCatalog;
    }

    addImageTable(name, imageTable) {
        this.imageTableMap.set(name, imageTable);
    }

    getImageTableByName(imageTableName) {
        return this.imageTableMap.get(imageTableName);
    }
}

module.exports = ImageCatalog;