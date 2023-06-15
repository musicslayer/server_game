const fs = require("fs");

const EntityCloner = require("../entity/EntityCloner.js");
const Tile = require("./Tile.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class Screen {
    map;
    x;
    y;

    // For now, these are just fixed numbers.
    numTilesX = 16;
    numTilesY = 12;

    tiles = [];
    entities = [];

    static loadScreenFromFile(screenFile, map) {
        let screen = new Screen();
        screen.map = map;

        let tileData = fs.readFileSync(screenFile, "ascii");
        let lines = tileData.split(CRLF);

        // Each line represents a tile within this screen.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the x,y
            let numPart = parts[0].split(COMMA);
            let x = Number(numPart.shift());
            let y = Number(numPart.shift());

            // Second part is the tiles
            let tilePart = parts[1].split(COMMA);
            if(tilePart[0]) {
                let imageTableIdxArray = [];
                let imageIdxArray = [];

                while(tilePart.length > 0) {
                    imageTableIdxArray.push(tilePart.shift());
                    imageIdxArray.push(tilePart.shift());
                }

                let tile = new Tile(imageTableIdxArray, imageIdxArray);
                screen.addTile(tile, x, y);
            }

            // Third part is the entities
            let entityPart = parts[2].split(COMMA);
            if(entityPart[0]) {
                while(entityPart.length > 0) {
                    let id = entityPart.shift();
                    let entity = EntityCloner.clone(id);
                    
                    entity.spawn(map.world, map, screen, x, y);
                }
            }
        }

        return screen;
    }

    static createVoidScreen(screenX, screenY) {
        let screen = new Screen();
        screen.x = screenX;
        screen.y = screenY;

        // Place void tiles.
        for(let x = 0; x < 16; x++) {
            for(let y = 0; y < 12; y++) {
                screen.addTile(new Tile(["_base"], ["void"]), x, y);
            }
        }

        return screen;
    }

    addTile(tile, x, y) {
        tile.x = x;
        tile.y = y;
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