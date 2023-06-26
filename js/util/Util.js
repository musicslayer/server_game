const fs = require("fs");
const { zip } = require("zip-a-folder");

class Util {
    static async createZipFileFromFolder(zipFile, folderPath) {
        // If the file exists, delete it to prevent any conflicts.
        if(fs.existsSync(zipFile)) {
            fs.unlinkSync(zipFile);
        }

        await zip(folderPath, zipFile);
    }

    static getDirectionalShift(direction) {
        let shiftArray = [0, 0];
    
        if(direction === "up") {
            shiftArray = [0, -1];
        }
        else if(direction === "down") {
            shiftArray = [0, 1];
        }
        else if(direction === "left") {
            shiftArray = [-1, 0];
        }
        else if(direction === "right") {
            shiftArray = [1, 0];
        }
    
        return shiftArray;
    }

    static getRandomInt(max) {
        // Returns a random int [0, max)
        return Math.floor(Math.random() * max);
    }
}

module.exports = Util;