const fs = require("fs");

const EntitySpawner = require("../entity/EntitySpawner.js");
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

    static loadScreenFromFile(screenFile) {
        let screen = new Screen();

        let tileData = fs.readFileSync(screenFile, "ascii");
        let lines = tileData.split(CRLF);

        // Each line represents a square within this screen.
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
                    let stackSize = Number(entityPart.shift());
                    EntitySpawner.spawn(id, stackSize, screen, x, y);
                }
            }
        }

        return screen;
    }

    attachMap(map) {
        this.map = map;
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

            if(entity.isPlayer) {
                this.checkDestruction();
            }
        }
    }

    isScreenUp() {
        return this.map.isScreenUp(this);
    }

    isScreenDown() {
        return this.map.isScreenDown(this);
    }

    isScreenLeft() {
        return this.map.isScreenLeft(this);
    }

    isScreenRight() {
        return this.map.isScreenRight(this);
    }

    getScreenUp() {
        return this.map.getScreenUp(this);
    }

    getScreenDown() {
        return this.map.getScreenDown(this);
    }

    getScreenLeft() {
        return this.map.getScreenLeft(this);
    }

    getScreenRight() {
        return this.map.getScreenRight(this);
    }

    getMapUp() {
        return this.map.getMapUp();
    }

    getMapDown() {
        return this.map.getMapDown();
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

    checkDestruction() {
        // For dynamic screens, register all entity destructions on this screen after all players leave.
        if(this.isDynamic && !this.isPlayerPresent()) {
            this.screenClear();
        }
    }

    isPlayerPresent() {
        // This is called after a player has already left this screen so they are not included in the check.
        for(let entity of this.entities) {
            if(entity.isPlayer) {
                return true;
            }
        }
        return false;
    }

    screenClear() {
        for(let entity of this.entities) {
            EntitySpawner.destroyInstance(entity);
        }
    }
}

module.exports = Screen;