const fs = require("fs");

const Tile = require("./Tile.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class Screen {
    map;
    name;
    x;
    y;

    // For now, these are just fixed numbers.
    numTilesX = 16;
    numTilesY = 12;

    tiles = [];
    otherEntities = [];
    playerEntities = [];

    getServer() {
        return this.map.world.server;
    }

    getWorld() {
        return this.map.world;
    }

    loadScreenFromFile(screenFile) {
        let tileData = fs.readFileSync(screenFile, "ascii");
        let lines = tileData ? tileData.split(CRLF) : [];

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
                tile.x = x;
                tile.y = y;
        
                this.addTile(tile);
            }

            // Third part is the entities
            let entityPart = parts[2].split(COMMA);
            if(entityPart[0]) {
                while(entityPart.length > 0) {
                    let id = entityPart.shift();
                    let stackSize = Number(entityPart.shift());
                    this.getWorld().spawn(id, stackSize, this, x, y);
                }
            }
        }

    }

    addTile(tile) {
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
            this.getWorld().register("instance", 1);
        }
        else {
            this.getWorld().register("persistent", 1);
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
            this.getWorld().deregister("instance", 1);

            // If there are no more players in an instance screen, then the entire screen should be deregistered.
            if(this.playerEntities.length === 0) {
                this.getWorld().deregister("instance", this.otherEntities.length);
            }
        }
        else {
            this.getWorld().deregister("persistent", 1);
        }
    }

    isFacingEdge(entity, direction) {
        let isFacingEdge;

        if(direction === "up") {
            isFacingEdge = entity.y == 0;
        }
        else if(direction === "down") {
            isFacingEdge = entity.y == 11;
        }
        else if(direction === "left") {
            isFacingEdge = entity.x == 0;
        }
        else if(direction === "right") {
            isFacingEdge = entity.x == 15;
        }

        return isFacingEdge;
    }

    isScreen(direction) {
        let isFacingScreen;

        if(direction === "up") {
            isFacingScreen = this.isScreenUp();
        }
        else if(direction === "down") {
            isFacingScreen = this.isScreenDown();
        }
        else if(direction === "left") {
            isFacingScreen = this.isScreenLeft();
        }
        else if(direction === "right") {
            isFacingScreen = this.isScreenRight();
        }

        return isFacingScreen;
    }

    getOverlappingEntities(entity, direction) {
        let x = entity.x;
        let y = entity.y;

        if(direction === "up") {
            y--;
        }
        else if(direction === "down") {
            y++;
        }
        else if(direction === "left") {
            x--;
        }
        else if(direction === "right") {
            x++;
        }

        let overlappingEntities = [];

        let screenEntities = this.otherEntities.concat(this.playerEntities);
        for(let screenEntity of screenEntities) {
            if(entity !== screenEntity && x === screenEntity.x && y === screenEntity.y) {
                overlappingEntities.push(screenEntity);
            }
        }

        return overlappingEntities;
    }

    getHighestEntity(x, y) {
        let highestEntity;

        // Iterate backwards to get the highest entity.
        let screenEntities = this.otherEntities.concat(this.playerEntities);
        for(let i = screenEntities.length - 1; i >= 0; i--) {
            let screenEntity = screenEntities[i];
            if(x === screenEntity.x && y === screenEntity.y) {
                highestEntity = screenEntity;
                break;
            }
        }

        return highestEntity;
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

    getWorldUp() {
        return this.map.world.getWorldUp();
    }

    getWorldDown() {
        return this.map.world.getWorldDown();
    }
}

module.exports = Screen;