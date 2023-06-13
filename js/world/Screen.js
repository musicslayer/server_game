const fs = require("fs");

const Tile = require("./Tile.js");

const COMMA = ",";
const CRLF = "\r\n";

class Screen {
    x;
    y;
    tiles = [];
    entities = [];

    static loadScreenFromFile(screenFile) {
        let screen = new Screen();

        let tileData = fs.readFileSync(screenFile, "ascii");
        let lines = tileData.split(CRLF);

        // First line is the x,y of this screen in the overall map.
        let line = lines.shift();
        let nums = line.split(COMMA);

        screen.x = Number(nums.shift());
        screen.y = Number(nums.shift());

        // All other lines represent x,y of the tiles within this screen.
        while(lines.length > 0) {
            let line = lines.shift();
            let nums = line.split(COMMA);

            let x = nums.shift();
            let y = nums.shift();

            let imageTableIdxArray = [];
            let imageIdxArray = [];

            while(nums.length > 0) {
                imageTableIdxArray.push(nums.shift());
                imageIdxArray.push(nums.shift());
            }

            let tile = new Tile(x, y, imageTableIdxArray, imageIdxArray);
            screen.addTile(tile);
        }

        return screen;
    }

    static createVoidScreen(x, y) {
        let screen = new Screen();
        screen.x = x;
        screen.y = y;

        // Place void tile.
        screen.addTile(new Tile(0, 0, ["_base"], ["void"]));
        screen.addTile(new Tile(1, 0, ["_base"], ["void"]));
        screen.addTile(new Tile(0, 1, ["_base"], ["void"]));
        screen.addTile(new Tile(1, 1, ["_base"], ["void"]));

        return screen;
    }

    addTile(tile) {
        this.tiles.push(tile);
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    getScreenImages() {
        // Returns an array of all the images that should be drawn on this screen.
        let images = [];

        // First get all the tile images.
        for(const tile of this.tiles) {
            images = images.concat(tile.getImages());
        }

        // Next get all of the images for entities that are currently on this screen.
        for(const entity of this.entities) {
            images = images.concat(entity.getImages());
        }

        return images;
    }
}

module.exports = Screen;