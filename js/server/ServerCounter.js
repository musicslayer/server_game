class ServerCounter {
    persistentEntityCount = 0; // Includes entities placed on a persistent screen.
    instanceEntityCount = 0; // Includes entities placed on dynamic screens (void, death) and regular instances (dungeons).
    inventoryEntityCount = 0; // Includes entities in inventories.
    goldCount = 0; // Includes gold in purses (not gold on the ground).

    register(type, number) {
        switch(type) {
            case "persistent":
                this.persistentEntityCount += number;
                break;
            case "instance":
                this.instanceEntityCount += number;
                break;
            case "inventory":
                this.inventoryEntityCount += number;
                break;
            case "gold":
                this.goldCount += number;
                break;
        }
    }

    deregister(type, number) {
        switch(type) {
            case "persistent":
                this.persistentEntityCount -= number;
                break;
            case "instance":
                this.instanceEntityCount -= number;
                break;
            case "inventory":
                this.inventoryEntityCount -= number;
                break;
            case "gold":
                this.goldCount -= number;
                break;
        }
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

        let serverCounter = new ServerCounter();
        serverCounter.persistentEntityCount = Number(j.persistentEntityCount);
        serverCounter.instanceEntityCount = Number(j.instanceEntityCount);
        serverCounter.inventoryEntityCount = Number(j.inventoryEntityCount);
        serverCounter.goldCount = Number(j.goldCount);

        return ServerCounter;
    }
}

module.exports = ServerCounter;