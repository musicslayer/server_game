const ImageCatalog = require("../image/ImageCatalog.js");
const Server = require("../server/Server.js");

class Entity {
    // e.g. The entity that spawned a projectile is the owner.
    owner;

    // Each subclass should have a unique ID.
    id;

    // TODO single source?
    numTilesX = 16;
    numTilesY = 12;

    world;
    map;
    screen;
    x;
    y;

    // To avoid awkward edge cases, just make every entity start facing to the right.
    direction = "right";

    // All of the main actions an entity can take are added onto the server queue.
    addExperience(experience) {
        Server.addTask(() => {
            this.doAddExperience(experience);
        });
    }

    addHealth(health) {
        Server.addTask(() => {
            this.doAddHealth(health);
        });
    }

    addMana(mana) {
        Server.addTask(() => {
            this.doAddMana(mana);
        });
    }

    checkCollision() {
        Server.addTask(() => {
            this.doCheckCollision();
        });
    }

    consume(entity) {
        Server.addTask(() => {
            this.doConsume(entity);
        });
    }

    despawn() {
        Server.addTask(() => {
            this.doDespawn();
        });
    }

    interact() {
        Server.addTask(() => {
            this.doInteract();
        });
    }

    spawn(world, map, screen, x, y) {
        Server.addTask(() => {
            this.doSpawn(world, map, screen, x, y);
        });
    }

    takeDamage(entity, damage) {
        Server.addTask(() => {
            this.doTakeDamage(entity, damage);
        });
    }

    

    




    

    action() {
        Server.addTask(() => {
            this.doAction();
        });
    }

    teleport(world, map, screen, x, y) {
        Server.addTask(() => {
            this.doTeleport(world, map, screen, x, y);
        });
    }


    moveLeft() {
        Server.addTask(() => {
            this.doMoveLeft();
        });
    }

    moveUp() {
        Server.addTask(() => {
            this.doMoveUp();
        });
    }

    moveRight() {
        Server.addTask(() => {
            this.doMoveRight();
        });
    }

    moveDown() {
        Server.addTask(() => {
            this.doMoveDown();
        });
    }





    screenLeft() {
        Server.addTask(() => {
            this.doScreenLeft();
        });
    }

    screenUp() {
        Server.addTask(() => {
            this.doScreenUp();
        });
    }

    screenRight() {
        Server.addTask(() => {
            this.doScreenRight();
        });
    }

    screenDown() {
        Server.addTask(() => {
            this.doScreenDown();
        });
    }


    mapUp() {
        Server.addTask(() => {
            this.doMapUp();
        });
    }

    mapDown() {
        Server.addTask(() => {
            this.doMapDown();
        });
    }




    doAddExperience(experience) {
        // By default, do nothing.
    }

    doAddHealth(health) {
        // By default, do nothing.
    }

    doAddMana(mana) {
        // By default, do nothing.
    }

    doCheckCollision() {
        // Call this after any movement to see if this entity is overlapping another on the same screen.
        let entities = this.screen.entities;
        for(let entity of entities) {
            if(this !== entity && this.x === entity.x && this.y === entity.y) {
                // TODO What order should this be in...?
                this.doInteract(entity);
                entity.doInteract(this);
            }
        }
    }

    doConsume(entity) {
        // By default, do nothing.
    }


    doSpawn(world, map, screen, x, y) {
        this.world = world;
        this.map = map;
        this.screen = screen;
        this.x = x;
        this.y = y;

        this.screen.addEntity(this);
    }

    doDespawn() {
        this.screen.removeEntity(this);
    }

    doInteract(entity) {
        // By default, do nothing.
    }



    doTakeDamage(entity, damage) {
        // By default, do nothing.
    }






    doAction() {
        // By default, do nothing.
    }

    doTeleport(world, map, screen, x, y) {
        // Move to an arbitrary point in the world.
        // This does not have to be called if the entity stays on the same screen (i.e. only x and y change).
        this.doDespawn();
        this.doSpawn(world, map, screen, x, y);

        // TODO Should we check collisions after an arbitrary teleport?
        // this.doCheckCollision()
    }


    // By default, movement happens one tile at a time, and if the edge is crossed then the entity moves to the next screen.
    // Also, if you move onto another entity, the two entities interact with each other.
    doMoveLeft() {
        this.direction = "left";
        this.x--;
        if(this.x < 0) {
            this.x = this.numTilesX - 1;
            this.doScreenLeft();
        }

        this.doCheckCollision();
    }

    doMoveUp() {
        this.direction = "up";
        this.y--;
        if(this.y < 0) {
            this.y = this.numTilesY - 1;
            this.doScreenUp();
        }

        this.doCheckCollision();
    }

    doMoveRight() {
        this.direction = "right";
        this.x++;
        if(this.x > this.numTilesX - 1) {
            this.x = 0;
            this.doScreenRight();
        }

        this.doCheckCollision();
    }

    doMoveDown() {
        this.direction = "down";
        this.y++;
        if(this.y > this.numTilesY - 1) {
            this.y = 0;
            this.doScreenDown();
        }

        this.doCheckCollision();
    }





    doScreenLeft() {
        let oldScreen = this.screen;
        let newScreen = this.map.getScreenLeft(oldScreen);
        this.doTeleport(this.world, this.map, newScreen, this.x, this.y);
    }

    doScreenUp() {
        let oldScreen = this.screen;
        let newScreen = this.map.getScreenAbove(oldScreen);
        this.doTeleport(this.world, this.map, newScreen, this.x, this.y);
    }

    doScreenRight() {
        let oldScreen = this.screen;
        let newScreen = this.map.getScreenRight(oldScreen);
        this.doTeleport(this.world, this.map, newScreen, this.x, this.y);
    }

    doScreenDown() {
        let oldScreen = this.screen;
        let newScreen = this.map.getScreenBelow(oldScreen);
        this.doTeleport(this.world, this.map, newScreen, this.x, this.y);
    }




    doMapUp() {
        let newMap = this.world.getMapAbove(this.map);
        if(newMap) {
            let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
            this.doTeleport(this.world, newMap, newScreen, this.x, this.y);
        }
    }

    doMapDown() {
        let newMap = this.world.getMapBelow(this.map);
        if(newMap) {
            let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
            this.doTeleport(this.world, newMap, newScreen, this.x, this.y);
        }
    }


    getImages() {
        // By default, use a generic picture.
        let images = [];
        images.push({
            x: this.x,
            y: this.y,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("_base").getImageByName("unknown")
        });
        return images;
    }

    getRootEntity(entity) {
        let rootEntity = entity;

        while(rootEntity.owner) {
            rootEntity = rootEntity.owner;
        }

        return rootEntity;
    }
}

module.exports = Entity;