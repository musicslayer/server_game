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

    serialize() {
        let s = "{";
        s += "\"persistentEntityCount\":";
        s += "\"" + this.persistentEntityCount + "\"";
        s += ",";
        s += "\"instanceEntityCount\":";
        s += "\"" + this.instanceEntityCount + "\"";
        s += ",";
        s += "\"inventoryEntityCount\":";
        s += "\"" + this.inventoryEntityCount + "\"";
        s += ",";
        s += "\"goldCount\":";
        s += "\"" + this.goldCount + "\"";
        s += "}";

        return s;
    }

    static deserialize(s) {
        let j = JSON.parse(s);

        let entityCounter = new EntityCounter();
        entityCounter.persistentEntityCount = Number(j.persistentEntityCount);
        entityCounter.instanceEntityCount = Number(j.instanceEntityCount);
        entityCounter.inventoryEntityCount = Number(j.inventoryEntityCount);
        entityCounter.goldCount = Number(j.goldCount);

        return entityCounter;
    }
}

module.exports = EntityCounter;