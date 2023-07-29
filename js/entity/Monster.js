const Entity = require("./Entity.js");
const MonsterAI = require("../ai/MonsterAI.js");
const Util = require("../util/Util.js");
const ServerTask = require("../server/ServerTask.js");

class Monster extends Entity {
    isAI = true;
    ai = new MonsterAI();

    health = 70;
    maxHealth = 100;
    experienceReward = 20;

    mana = 20;
    maxMana = 100;
    manaRegen = 1; // per second

    isTangible = true;

    moveTime = 1;
    actionTime = 1;

    aggroMap = new Map();
    maxAggro = 300;
    aggroGain = 1;
    aggroForgiveness = 10;
    aggroForgivenessTime = 10;

    lastPlayerID;

    getName() {
        return "Monster";
    }

    getInfo() {
        return "A creature that you can kill for loot and experience.";
    }

    doSpawn() {
        super.doSpawn();

        // Use this to gradually decrease aggro over time.
        let serverTask = new ServerTask((monster) => {
            monster.decreaseAggro();
        }, this);

        this.getServer().scheduleRefreshTask(undefined, this.aggroForgivenessTime, serverTask);

        // Monster activities are controlled by an AI class.
        this.ai.generateNextActivity(this);
    }

    doTakeDamage(entity, damage) {
        this.health = Math.max(this.health - damage, 0);

        let rootEntity = this.getRootEntity(entity);

        // If damage came from a player, increase aggro.
        if(rootEntity.isPlayer) {
            this.lastPlayerID = rootEntity.uid;

            let aggro = this.aggroMap.get(rootEntity.uid) ?? 0;
            aggro = Math.min(aggro + this.aggroGain, this.maxAggro);
            this.aggroMap.set(rootEntity.uid, aggro);
        }

        if(this.health === 0) {
            this.aggroMap.clear();

            let gold = Entity.createInstance("Gold", 100);
            gold.screen = this.screen;
            gold.x = this.x;
            gold.y = this.y;
    
            gold.doSpawnAsLoot();

            this.doDespawn();
            this.owner?.onMonsterDespawn();

            if(rootEntity.isPlayer) {
                rootEntity.doAddExperience(this.experienceReward);
            }
        }
    }

    decreaseAggro() {
        // If a player is no longer on the screen, decrease the aggro for that player.
        for(let playerID of this.aggroMap.keys()) {
            // TODO
            /*
            let player = EntityFactory.entityMap.get(playerID);
            if(!this.screen.playerEntities.includes(player)) {
                let aggro = this.aggroMap.get(playerID) ?? 0;
                let newAggro = Math.max(aggro - this.aggroForgiveness, 0);

                if(newAggro === 0) {
                    this.aggroMap.delete(playerID);
                }
                else {
                    this.aggroMap.set(playerID, newAggro);
                }
            }
            */
        }
    }

    getAggroPlayer() {
        // Returns the player that currently has the aggro.
        let playerIDs = [];

        // First find max aggro.
        let max = 0;
        for(let player of this.screen.playerEntities) {
            let aggro = this.aggroMap.get(player.uid) ?? 0;
            max = Math.max(max, aggro);

            if(max === aggro) {
                playerIDs.push(player.uid);
            }
        }

        if(max === 0 || playerIDs.length === 0) {
            // If no players have non-zero aggro, than don't target anyone.
            return undefined;
        }

        // If the last player to hit the monster is tied for first, choose that one.
        if(playerIDs.includes(this.lastPlayerID)) {
            return this.lastPlayerID;
        }

        // Otherwise, just return the first player in the array.
        return playerIDs[0];
    }

    doAction() {
        // Spawn a "melee projectile" representing a melee attack.
        // If the monster is moving, fire the projectile ahead of the motion.
        let projectile = Entity.createInstance("MeleeProjectile", 1, 1, 40, false);
        projectile.screen = this.screen;
        projectile.x = this.getMovementX();
        projectile.y = this.getMovementY();
        projectile.direction = this.direction;

        this.doSpawnEntity(projectile);
    }

    doMoveStep() {
        let [shiftX, shiftY] = Util.getDirectionalShift(this.direction);
        this.x += shiftX;
        this.y += shiftY;
    }

    canCrossScreen() {
        return false;
    }
}

module.exports = Monster;