const Wall = require("./Wall.js");
const FireTrap = require("./FireTrap.js");
const HealthPotion = require("./HealthPotion.js");
const ManaPotion = require("./ManaPotion.js");
const InvinciblePotion = require("./InvinciblePotion.js");
const Monster = require("./Monster.js");

// TODO Each individual map should take care of this somehow...

class EntitySpawner {
    static spawnWorld(world) {
        // Spawns all initial entities one time at the creation of the server.
        let wall = new Wall();
        wall.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 2, 2);

        let fireTrap = new FireTrap();
        fireTrap.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 10, 10);

        let monster1 = new Monster();
        monster1.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 5, 5);

        let monster2 = new Monster();
        monster2.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 4, 5);

        let healthPotion1 = new HealthPotion();
        healthPotion1.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 0, 7);

        let healthPotion2 = new HealthPotion();
        healthPotion2.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 0, 8);

        let healthPotion3 = new HealthPotion();
        healthPotion3.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 0, 9);

        let manaPotion1 = new ManaPotion();
        manaPotion1.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 0, 10);

        let invinciblePotion1 = new InvinciblePotion();
        invinciblePotion1.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 5, 11);

        let invinciblePotion2 = new InvinciblePotion();
        invinciblePotion2.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 6, 11);

        let invinciblePotion3 = new InvinciblePotion();
        invinciblePotion3.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 7, 11);
    }
}

module.exports = EntitySpawner;