class ServerFunction {
    static functionMap = new Map();

    static init() {
        // Manually add all functions that could be scheduled on the server.
        // TODO What order?
        let map = ServerFunction.functionMap;

        map.set("_wrapper", (_this, animation, time, serverTask) => {
            if(!serverTask.isCancelled) {
                serverTask.execute();

                serverTask.count--;
                if(serverTask.count > 0) {
                    // TODO Can we access "_this" or "_this.server" from inside the function without needing it passed in?
                    _this.server.addTask(animation, time, _this);
                }
            }
        })

        map.set("spawn", (entity) => {
            entity.doSpawn();
        })

        map.set("despawn", (entity) => {
            entity.doDespawn();
        })

        map.set("change_direction", (entity, direction) => {
            entity.doChangeDirection(direction);
        })

        map.set("move_step", (entity) => {
            entity.doMoveStep();
        })

        map.set("move_screen", (entity, direction) => {
            entity.doMoveScreen(direction);
        })

        map.set("move_map", (entity, direction) => {
            entity.doMoveMap(direction);
        })

        map.set("move_world", (entity, direction) => {
            entity.doMoveWorld(direction);
        })

        map.set("action", (entity) => {
            entity.doAction();
        })

        map.set("teleport", (entity, x, y) => {
            entity.doTeleport(entity.screen, x, y);
        })

        map.set("kill", (entity) => {
            entity.doKill();
        })

        map.set("revive", (entity) => {
            entity.doRevive();
        })

        map.set("teleport_home", (entity) => {
            entity.doTeleportHome();
        })

        map.set("make_invincible", (entity, invincibleSeconds) => {
            entity.doMakeInvincible(invincibleSeconds);
        })

        map.set("invincible_off", (entity) => {
            entity.isInvincible = false;
        })

        map.set("add_experience", (entity, experienceReward) => {
            entity.doAddExperience(experienceReward);
        })

        map.set("add_health", (entity, healthReward) => {
            entity.doAddHealth(healthReward);
        })

        map.set("add_mana", (entity, manaReward) => {
            entity.doAddMana(manaReward);
        })

        map.set("regen", (entity) => {
            entity.doAddHealth(entity.healthRegen)
            entity.doAddMana(entity.manaRegen)
        })

        map.set("decrease_aggro", (entity) => {
            entity.decreaseAggro();
        })

        map.set("set_delay_off", (entity, delayType) => {
            entity.delayMap.set(delayType, false);
        })

        map.set("animation_shift", (entity, fraction, shiftX, shiftY) => {
            entity.animationShiftX = (shiftX * fraction);
            entity.animationShiftY = (shiftY * fraction);
        })

        map.set("animation_reset", (entity) => {
            entity.isMoveInProgress = false;
            entity.animationShiftX = 0;
            entity.animationShiftY = 0;
        })

        map.set("ai_generate_next_activity", (entity) => {
            entity.ai.generateNextActivity(entity);
        })

        map.set("spawn_entity", (entity, otherEntity) => {
            entity.doSpawnEntity(otherEntity);
        })

        map.set("spawn_monster", (entity) => {
            entity.doSpawnEntity(entity.createMonsterInstance());
            entity.onMonsterSpawn();
        })

        map.set("select_screen_entity", (entity, x, y) => {
            entity.selectedEntity = entity.screen.getHighestEntity(x, y);
        })

        map.set("select_inventory_entity", (entity, slot) => {
            entity.selectedSlot = slot;
            entity.selectedEntity = entity.inventory.itemMap.get(slot);
        })

        map.set("consume_from_inventory", (entity, slot) => {
            entity.doConsumeFromInventory(slot);
        })

        map.set("drop_from_inventory", (entity, slot, number) => {
            entity.doDropFromInventory(slot, number);
        })

        map.set("inventory_swap", (entity, slot1, slot2) => {
            if(entity.selectedSlot === slot1) {
                entity.selectedEntity = entity.inventory.itemMap.get(slot1);
                entity.selectedSlot = slot2;
            }
            else if(entity.selectedSlot === slot2) {
                entity.selectedEntity = entity.inventory.itemMap.get(slot2);
                entity.selectedSlot = slot1;
            }
            
            entity.doSwapInventorySlots(slot1, slot2);
        })

        map.set("inventory_previous", (entity) => {
            entity.selectedSlot = entity.selectedSlot === 0 ? entity.inventory.maxSlots - 1 : entity.selectedSlot - 1;
            entity.selectedEntity = entity.inventory.itemMap.get(entity.selectedSlot);
        })

        map.set("inventory_next", (entity) => {
            entity.selectedSlot = entity.selectedSlot === entity.inventory.maxSlots - 1 ? 0 : entity.selectedSlot + 1;
            entity.selectedEntity = entity.inventory.itemMap.get(entity.selectedSlot);
        })

        map.set("drop_from_purse", (entity, goldAmount) => {
            entity.doDropFromPurse(goldAmount);
        })
    }

    static getFunction(name) {
        return ServerFunction.functionMap.get(name);
    }
}

module.exports = ServerFunction;