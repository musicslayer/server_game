const fs = require("fs");
const path = require("path");

const ZipStream = require("./ZipStream.js");

class Zip {
    static createZipFileFromFolder(zipFilePath, srcFolder) {
        // If the file exists, delete it to prevent any conflicts.
        if(fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath);
        }

        srcFolder = path.resolve(srcFolder);

        // Check that we have access to both the source and destination folders.
        fs.accessSync(srcFolder, fs.constants.R_OK);
        fs.accessSync(path.dirname(zipFilePath), fs.constants.R_OK | fs.constants.W_OK);

        // Recursive process the directory, adding any files found along the way to the zip file.
        let zipStream = new ZipStream(zipFilePath);
        Zip.processDirectory(zipStream, srcFolder, "");
        zipStream.finish();
    }

    static processDirectory(zipStream, path, dir) {
        let files = fs.readdirSync(path + dir, {withFileTypes: true});
        for(const file of files) {
            const filename = dir + '/' + file.name;
            const relative = filename.slice(1); // Remove the leading /
            const absolute = path + '/' + relative;
    
            let stats = fs.lstatSync(absolute);
            if(stats.isDirectory()) {
                Zip.processDirectory(zipStream, path, filename);
            }
            else {
                zipStream.addFile(relative, absolute, stats.mtime);
            }
        }
    }
}

module.exports = Zip;