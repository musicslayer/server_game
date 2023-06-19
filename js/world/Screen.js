const fs = require("fs");

const EntitySpawner = require("../entity/EntitySpawner.js");
const Server = require("../server/Server.js");
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
    playerEntities = [];
    otherEntities = [];

    loadScreenFromFile(screenFile) {
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
                this.addTile(tile, x, y);
            }

            // Third part is the entities
            let entityPart = parts[2].split(COMMA);
            if(entityPart[0]) {
                while(entityPart.length > 0) {
                    let id = entityPart.shift();
                    let stackSize = Number(entityPart.shift());
                    EntitySpawner.spawn(id, stackSize, this, x, y);
                }
            }
        }

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
        if(entity.isPlayer) {
            this.playerEntities.push(entity);
        }
        else {
            this.otherEntities.push(entity);
        }

        if(this.isDynamic) {
            Server.registerInstanceEntity(1);
        }
        else {
            Server.registerWorldEntity(1);
        }
    }

    removeEntity(entity) {
        if(entity.isPlayer) {
            const index = this.playerEntities.indexOf(entity);
            if(index > -1) {
                this.playerEntities.splice(index, 1);
            }
        }
        else {
            const index = this.otherEntities.indexOf(entity);
            if(index > -1) {
                this.otherEntities.splice(index, 1);
            }
        }

        if(this.isDynamic) {
            Server.deregisterInstanceEntity(1);

            // If there are no more players in an instance screen, then the entire screen should be deregistered.
            if(this.playerEntities.length === 0) {
                Server.deregisterInstanceEntity(this.otherEntities.length);
            }
        }
        else {
            Server.deregisterWorldEntity(1);
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

        // Next get all of the non-player images.
        for(const entity of this.otherEntities) {
            images = images.concat(entity.getImages());
        }

        // Finally get all of the player images (so that players are always drawn on top).
        for(const entity of this.playerEntities) {
            images = images.concat(entity.getImages());
        }

        return images;
    }
}

module.exports = Screen;