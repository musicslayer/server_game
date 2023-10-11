const Entity = require("../Entity.js");
const MonsterAI = require("../../ai/MonsterAI.js");
const ServerTask = require("../../server/ServerTask.js");
const Util = require("../../util/Util.js");

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

    lastPlayer_uid;

    getName() {
        return "Monster";
    }

    getEntityName() {
        return "creature_monster";
    }

    getInfo() {
        return "A creature that you can kill for loot and experience.";
    }

    doSpawn() {
        super.doSpawn();

        // Use this to gradually decrease aggro over time.
        let serverTask = new ServerTask(undefined, this.aggroForgivenessTime, Number.POSITIVE_INFINITY, "decrease_aggro", this);

        this.ownServerTask(serverTask);
        this.getServer().scheduleTask(serverTask);

        // Monster activities are controlled by an AI class.
        this.ai.generateNextActivity(this);
    }

    doTakeDamage(entity, damage) {
        this.health = Math.max(this.health - damage, 0);

        let rootEntity = this.getRootEntity(entity);

        // If damage came from a player, increase aggro.
        if(rootEntity.isPlayer) {
            this.setLastPlayer(rootEntity);

            let aggro = this.aggroMap.get(rootEntity.uid) ?? 0;
            aggro = Math.min(aggro + this.aggroGain, this.maxAggro);
            this.aggroMap.set(rootEntity.uid, aggro);
        }

        if(this.health === 0) {
            this.aggroMap.clear();

            let gold = Entity.createInstance("Gold", 100);
            gold.setScreen(this.screen);
            gold.x = this.x;
            gold.y = this.y;
    
            gold.doSpawnAsLoot();

            this.doDespawn();
            this.getOwner()?.onMonsterDespawn();

            if(rootEntity.isPlayer) {
                rootEntity.doAddExperience(this.experienceReward);
            }
        }
    }

    decreaseAggro() {
        // If a player is no longer on the screen, decrease the aggro for that player.
        for(let player_uid of this.aggroMap.keys()) {
            let player = Entity.getEntity(player_uid);
            if(!this.screen.entities.includes(player)) {
                let aggro = this.aggroMap.get(player.uid) ?? 0;
                let newAggro = Math.max(aggro - this.aggroForgiveness, 0);

                if(newAggro === 0) {
                    this.aggroMap.delete(player.uid);
                }
                else {
                    this.aggroMap.set(player.uid, newAggro);
                }
            }
        }
    }

    getAggroPlayer() {
        // Returns the player that currently has the aggro.
        let players = [];

        // First find max aggro.
        let max = 0;
        for(let entity of this.screen.entities) {
            // Only players can have aggro, not other entities.
            if(!entity.isPlayer) {
                continue;
            }

            let aggro = this.aggroMap.get(entity.uid) ?? 0;
            max = Math.max(max, aggro);

            if(max === aggro) {
                players.push(entity);
            }
        }

        if(max === 0 || players.length === 0) {
            // If no players have non-zero aggro, than don't target anyone.
            return undefined;
        }

        // If the last player to hit the monster is tied for first, choose that one.
        if(players.includes(this.getLastPlayer())) {
            return this.getLastPlayer();
        }

        // Otherwise, just return the first player in the array.
        return players[0];
    }

    doAction() {
        // Spawn a "melee projectile" representing a melee attack.
        // If the monster is moving, fire the projectile ahead of the motion.
        let projectile = Entity.createInstance("MeleeProjectile", 1);
        projectile.setScreen(this.screen);
        projectile.x = this.getMovementX();
        projectile.y = this.getMovementY();
        projectile.direction = this.direction;
        projectile.range = 1;
        projectile.damage = 40;
        projectile.isMulti = false;

        this.doSpawnEntity(projectile);
    }

    doMoveStep(direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        this.x += shiftX;
        this.y += shiftY;
    }

    canCrossScreen() {
        return false;
    }
}

module.exports = Monster;