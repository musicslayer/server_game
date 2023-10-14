import { UnzipStream } from "./UnzipStream.js";

class ImageCatalog {
    imageMap = new Map();

    async createImageCatalog() {
        let fileDataMap = await this.fetchZipDataMap();
        
        for(let filePath of fileDataMap.keys()) {
            // Images are stored using both their folder name and file name.
            // "filePath" will always have the format ".../[category]/[folder]/[file].png"
            let fileParts = filePath.split("/").slice(-3);
            let category = fileParts[0];
            let folder = fileParts[1];
            let file = fileParts[2].slice(0, -4);
            
            // We load each image now and store it for future use.
            let fileData = fileDataMap.get(filePath);
            let blob = new Blob([fileData.uncompressedFileContent]);
            let imageURL = URL.createObjectURL(blob);
            let image = new Image();
            await new Promise(r => image.onload = r, image.src = imageURL);
            
            this.addImage(category, folder, file, image);
        }
    }
    
    async fetchZipDataMap() {
        // Get a zip file containing all game images from the server.
        let response = await fetch("/images");        
        let data = new Uint8Array(await response.arrayBuffer());
        
        // Return a map with the uncompressed file information.
        let unzipStream = new UnzipStream(data);
        await unzipStream.extractFiles();
        return unzipStream.fileDataMap;
    }

    addImage(category, folder, file, image) {
        this.imageMap.set(category + "#" + folder + "#" + file, image);
    }

    getImage(category, folder, file, animationFrame) {
        return this.imageMap.get(category + "#" + folder + "#" + file + animationFrame)
        ?? this.imageMap.get(category + "#" + folder + "#" + file)
        ?? this.imageMap.get("base#base#unknown");
    }
    
    getImageByEntityImageName(imageName, animationFrame) {
        // Entity image names are always in the format "[folder]_[file]"
        let [entityFolder, entityFile] = imageName.split("_");
        let image = this.getImage("entity", entityFolder, entityFile, animationFrame);
        return image;
    }
    
    getImageByTileName(tileName, animationFrame) {
        // Tile names are always in the format "[folder]_[file]"
        let [tileFolder, tileFile] = tileName.split("_");
        let image = this.getImage("tile", tileFolder, tileFile, animationFrame);
        return image;
    }
    
    getImageByStatusName(statusName, animationFrame) {
        let image = this.getImage("status", "status", statusName, animationFrame);
        return image;
    }
}

export { ImageCatalog };