const fs = require("fs");

const Reflection = require("../reflection/Reflection.js");
const Entity = require("../entity/Entity.js");
const ServerTask = require("../server/ServerTask.js");
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

    // For now, these are just fixed numbers.
    numTilesX = 16;
    numTilesY = 12;

    pvpStatus;

    tiles = [];
    entities = [];

    static loadScreenFromFile(map, className, screenFile) {
        let screen = Reflection.createInstance(className);
        screen.map = map;

        let screenData = fs.readFileSync(screenFile, "ascii");
        let lines = screenData ? screenData.split(CRLF) : [];

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

                    let entity = Entity.createInstance(id, stackSize);
                    entity.setScreen(screen);
                    entity.x = x;
                    entity.y = y;

                    // Schedule each entity to be spawned.
                    let serverTask = new ServerTask((entity) => {
                        entity.doSpawn();
                    }, entity);
        
                    entity.getServer().scheduleTask(undefined, 0, 1, serverTask);
                }
            }
        }

        return screen;
    }

    addTile(tile) {
        this.tiles.push(tile);
    }

    addEntity(entity) {
        this.entities.push(entity);
        this.registerEntity(entity);
    }

    removeEntity(entity) {
        let index = this.entities.indexOf(entity);
        this.entities.splice(index, 1);
        this.deregisterEntity(entity);
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
        let entitiesAt = [];

        for(let entity of this.entities) {
            if(entity.isAt(x, y)) {
                entitiesAt.push(entity);
            }
        }

        return entitiesAt;
    }

    getHighestEntity(x, y) {
        let highestEntity;

        // Iterate backwards to get the highest entity.
        let entities = this.entities;
        for(let i = entities.length - 1; i >= 0; i--) {
            let entity = entities[i];
            if(entity.isAt(x, y)) {
                highestEntity = entity;
                break;
            }
        }

        return highestEntity;
    }

    getScreenInDirection(direction) {
        return this.map.getScreenInDirection(this, direction);
    }

    registerEntity(entity) {
        // By default, do nothing.
    }

    deregisterEntity(entity) {
        // By default, do nothing.
    }

    serialize(writer) {
        // Only serialize non-players here.
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", Util.getClassName(this))
            .serialize("name", this.name)
            .serialize("x", this.x)
            .serialize("y", this.y)
            .serialize("numTilesX", this.numTilesX)
            .serialize("numTilesY", this.numTilesY)
            .serialize("pvpStatus", this.pvpStatus)
            .serializeArray("tiles", this.tiles)
            .referenceArray("entities", this.entities)
        .endObject();
    }

    static deserialize(reader) {
        let screen;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let className = reader.deserialize("className", "String");
            screen = Reflection.createInstance(className);

            screen.name = reader.deserialize("name", "String");
            screen.x = reader.deserialize("x", "Number");
            screen.y = reader.deserialize("y", "Number");
            screen.numTilesX = reader.deserialize("numTilesX", "Number");
            screen.numTilesY = reader.deserialize("numTilesY", "Number");
            screen.pvpStatus = reader.deserialize("pvpStatus", "String");
            
            let tiles = reader.deserializeArray("tiles", "Tile");
            let entities = reader.dereferenceArray("entities", "Entity");

            for(let tile of tiles) {
                screen.addTile(tile);
            }

            for(let entity of entities) {
                entity.screen = screen;
                screen.addEntity(entity);
            }
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return screen;
    }
}

module.exports = Screen;