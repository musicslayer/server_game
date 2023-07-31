const fs = require("fs");

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

    static async processDirectory(zipStream, path, dir) {
        let files = fs.readdirSync(path + dir);
        for(const file of files) {
            const filename = dir + '/' + file;
            const relative = filename.slice(1); // Remove the leading /
            const absolute = path + '/' + relative;
    
            let stats = fs.lstatSync(absolute);
            if(stats.isDirectory()) {
                await Zip.processDirectory(zipStream, path, filename);
            }
            else {
                await zipStream.addFile(relative, absolute, stats.mtime);
            }
        }
    }
}

module.exports = Zip;