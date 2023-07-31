const fs = require("fs");
const path = require("path");

const ZipStream = require("./ZipStream.js");

class Zip {
    static async createZipFileFromFolder(zipFilePath, srcFolder) {
        // If the zip file already exists, delete it up front to prevent any conflicts later.
        if(fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath);
        }

        // Recursively process the directory, adding any files found along the way to the zip file.
        let zipStream = new ZipStream(zipFilePath);
        await Zip.processDirectory(zipStream, srcFolder, "");
        zipStream.finish();
    }

    static async processDirectory(zipStream, baseDir, dir) {
        let folder = path.join(baseDir, dir);
        let items = fs.readdirSync(folder);
        for(const item of items) {
            const relativePath = path.join(dir, item);
            const absolutePath = path.join(baseDir, relativePath);
    
            let stats = fs.lstatSync(absolutePath);
            if(stats.isDirectory()) {
                await Zip.processDirectory(zipStream, baseDir, relativePath);
            }
            else {
                await zipStream.addFile(relativePath, absolutePath, stats.mtime);
            }
        }
    }
}

module.exports = Zip;