const FireTrap = require("./FireTrap.js");
const HealthPotion = require("./HealthPotion.js");
const ManaPotion = require("./ManaPotion.js");
const Monster = require("./Monster.js");

class EntitySpawner {
    static spawnWorld(world) {
        // Spawns all initial entities one time at the creation of the server.
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
    }
}

module.exports = EntitySpawner;