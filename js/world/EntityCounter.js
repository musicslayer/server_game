class EntityCounter {
    persistentEntityCount = 0; // Includes entities placed on a persistent screen.
    instanceEntityCount = 0; // Includes entities placed on dynamic screens (void, death) and regular instances (dungeons).
    inventoryEntityCount = 0; // Includes entities in inventories.
    goldCount = 0; // Includes gold in purses (not gold on the ground).

    registerPersistentEntity(number) {
        this.persistentEntityCount += number;
    }

    registerInstanceEntity(number) {
        this.instanceEntityCount += number;
    }

    registerInventoryEntity(number) {
        this.inventoryEntityCount += number;
    }

    registerGold(number) {
        this.goldCount += number;
    }

    deregisterPersistentEntity(number) {
        this.persistentEntityCount -= number;
    }

    deregisterInstanceEntity(number) {
        this.instanceEntityCount -= number;
    }

    deregisterInventoryEntity(number) {
        this.inventoryEntityCount -= number;
    }
    
    deregisterGold(number) {
        this.goldCount -= number;
    }
}

module.exports = EntityCounter;