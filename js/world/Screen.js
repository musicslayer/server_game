const fs = require("fs");

const EntityFactory = require("../entity/EntityFactory.js");
const WorldFactory = require("./WorldFactory.js");
const Tile = require("./Tile.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class Screen {
    map;
    name;
    x;
    y;
    pvpStatus;

    // For now, these are just fixed numbers.
    numTilesX = 16;
    numTilesY = 12;

    tiles = [];
    otherEntities = [];
    playerEntities = [];

    static loadScreenFromFile(className, screenFile) {
        let screen = WorldFactory.createInstance(className);

        let tileData = fs.readFileSync(screenFile, "ascii");
        let lines = tileData ? tileData.split(CRLF) : [];

        // Each line represents a square within this screen.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the x,y
            let numPart = parts.shift().split(COMMA);
            let x = Number(numPart.shift());
            let y = Number(numPart.shift());

            // Second part is the tiles
            let tilePart = parts.shift().split(COMMA);
            if(tilePart[0]) {
                let imageFolders = [];
                let imageFiles = [];

                while(tilePart.length > 0) {
                    imageFolders.push(tilePart.shift());
                    imageFiles.push(tilePart.shift());
                }

                let tile = new Tile(imageFolders, imageFiles);
                tile.x = x;
                tile.y = y;
        
                screen.addTile(tile);
            }

            // Third part is the entities
            let entityPart = parts.shift().split(COMMA);
            if(entityPart[0]) {
                while(entityPart.length > 0) {
                    let id = entityPart.shift();
                    let stackSize = Number(entityPart.shift());

                    let entity = EntityFactory.createInstance(id, stackSize);
                    entity.screen = screen;
                    entity.x = x;
                    entity.y = y;

                    // Don't spawn entities here. This will be done later.
                    screen.addEntity(entity);
                }
            }
        }

        return screen;
    }

    addTile(tile) {
        this.tiles.push(tile);
    }

    addEntity(entity) {
        if(entity.isPlayer) {
            const index = this.playerEntities.indexOf(entity);
            if(index === -1) {
                this.playerEntities.push(entity);
            }
        }
        else {
            const index = this.otherEntities.indexOf(entity);
            if(index === -1) {
                this.otherEntities.push(entity);
            }
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
    }

    isFacingEdge(entity, direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        let x = entity.x + shiftX;
        let y = entity.y + shiftY;

        return x < 0 || x > this.numTilesX - 1 || y < 0 || y > this.numTilesY - 1;
    }

    doCrossScreen(entity, direction) {
        // Move to the next screen and wrap position around.
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        entity.x -= shiftX * (this.numTilesX - 1);
        entity.y -= shiftY * (this.numTilesY - 1)
        
        entity.doMoveScreen(direction);
    }

    isScreenInDirection(direction) {
        return this.map.isScreenInDirection(this, direction);
    }

    getOverlappingEntities(entity) {
        let overlappingEntities = this.getEntitiesAt(entity.x, entity.y);
        if(entity.isMoveInProgress) {
            overlappingEntities = overlappingEntities.concat(this.getEntitiesAt(entity.getMovementX(), entity.getMovementY()));
        }

        return overlappingEntities;
    }

    getEntitiesAt(x, y) {
        let entities = [];

        let screenEntities = this.otherEntities.concat(this.playerEntities);
        for(let screenEntity of screenEntities) {
            if(screenEntity.isAt(x, y)) {
                entities.push(screenEntity);
            }
        }

        return entities;
    }

    getHighestEntity(x, y) {
        let highestEntity;

        // Iterate backwards to get the highest entity.
        let screenEntities = this.otherEntities.concat(this.playerEntities);
        for(let i = screenEntities.length - 1; i >= 0; i--) {
            let screenEntity = screenEntities[i];
            if(screenEntity.isAt(x, y)) {
                highestEntity = screenEntity;
                break;
            }
        }

        return highestEntity;
    }

    getScreenInDirection(direction) {
        return this.map.getScreenInDirection(this, direction);
    }

    getMapInDirection(direction) {
        return this.map.getMapInDirection(direction);
    }

    getWorldInDirection(direction) {
        return this.map.world.getWorldInDirection(direction);
    }

    serialize() {
        let s = "{";
        s += "\"name\":";
        s += "\"" + this.name + "\"";
        s += ",";
        s += "\"x\":";
        s += "\"" + this.x + "\"";
        s += ",";
        s += "\"y\":";
        s += "\"" + this.y + "\"";
        s += ",";
        s += "\"numTilesX\":";
        s += "\"" + this.numTilesX + "\"";
        s += ",";
        s += "\"numTilesY\":";
        s += "\"" + this.numTilesY + "\"";
        s += ",";
        s += "\"pvpStatus\":";
        s += "\"" + this.pvpStatus + "\"";
        s += ",";



        s += "\"tiles\":";
        s += "[";
        for(let tile of this.tiles) {
            s += tile.serialize();
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += ",";

        s += "\"otherEntities\":";
        s += "[";
        for(let otherEntity of this.otherEntities) {
            if(otherEntity.isSerializable) {
                s += otherEntity.serialize();
                s += ",";
            }
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";

        // Only serialize non-players here.
        s += "}";

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);

        this.name = j.name;
        this.x = Number(j.x);
        this.y = Number(j.y);
        this.numTilesX = Number(j.numTilesX);
        this.numTilesY = Number(j.numTilesY);
        this.pvpStatus = j.pvpStatus;

        for(let tile_j of j.tiles) {
            let tile_s = JSON.stringify(tile_j);

            let tile = new Tile();
            tile.deserialize(tile_s);

            this.addTile(tile);
        }

        // Only deserialize non-players here.
        for(let otherEntity_j of j.otherEntities) {
            let otherEntity = EntityFactory.createInstance(otherEntity_j.getClassName(), Number(otherEntity_j.stackSize));
            otherEntity.screen = this;
            otherEntity.x = Number(otherEntity_j.x);
            otherEntity.y = Number(otherEntity_j.y);

            // Don't spawn entities here. This will be done later.
            this.addEntity(otherEntity);
        }
    }
}

module.exports = Screen;