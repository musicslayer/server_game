const { Worker } = require("worker_threads");

class Server {
    // TODO Use REFRESH_TIME

    // TODO Remove:
    static SERVER;

    // These variables affect server performance.
    TICK_RATE = 60; // times per second
    MOVEMENT_FRAMES = 60; // frames per 1 tile of movement
    MAX_ENTITY_COUNT = 100000000;
    REFRESH_TIME = 1; // seconds between refreshes.
    LOOT_TIME = 300; // (5 minutes) seconds that spawned loot will remain in the world before despawning

    worlds = [];
    worldMap = new Map();
    worldPosMap = new Map();

    refreshTaskQueue = []; // Tasks that occur every second (not every tick).

    // TODO REMOVE
    immediateTaskQueue = [];

    scheduledTaskMap = new Map(); 

    // These counters are for all worlds combined.
    currentWorldEntityCount = 0;
    currentInstanceEntityCount = 0; // Includes dynamic screens (void, death) and regular instances (dungeons).
    currentInventoryEntityCount = 0;

    currentTick = 0;

    createWorld(id, name, worldFolder) {
        // This require cannot be placed at the top of the file because it creates a circular dependency loop.
        const World = require("../world/World.js");

        let world = new World();
        world.loadWorldFromFolder(worldFolder);
        
        world.attachServer(this);
        this.addWorld(name, world, id);
    }

    addWorld(name, world, id) {
        world.id = id;

        this.worlds.push(world);
        this.worldMap.set(name, world);

        this.worldPosMap.set(id, world);
    }

    getWorld(name) {
        return this.worldMap.get(name);
    }

    getWorldUp(world) {
        // If this world does not exist, return the original world so nothing changes.
        return this.getWorldByPosition(world.id + 1) ?? world;
    }

    getWorldDown(world) {
        // If this world does not exist, return the original world so nothing changes.
        return this.getWorldByPosition(world.id - 1) ?? world;
    }

    getWorldByPosition(p) {
        return this.worldPosMap.get(p);
    }






    addRefreshTask(fcn) {
        this.refreshTaskQueue.push(fcn);
    }

    // Just add a seconds argument to this.
    addTask(fcn) {
        //this.immediateTaskQueue.push(fcn);
        this.scheduleTaskForSeconds(0, fcn);
    }

    // TODO remove!
    scheduleTaskForSeconds(seconds, fcn) {
        let tick = this.currentTick + seconds * this.TICK_RATE;
        let tasks = this.scheduledTaskMap.get(tick);
        if(tasks === undefined) {
            tasks = [];
        }
        tasks.push(fcn);
        this.scheduledTaskMap.set(tick, tasks);
    }

    processRefreshTasks() {
        // Refresh tasks are recurring, so do not empty the array.
        for(let fcn of this.refreshTaskQueue) {
            fcn();
        }
    }

    processTasks() {
        // Store the queue here. Anything added at this point won't be executed until the next tick.
        let immediateTaskQueue = this.immediateTaskQueue;
        this.immediateTaskQueue = [];

        let tasks = this.scheduledTaskMap.get(this.currentTick);
        if(tasks !== undefined) {
            for(let task of tasks) {
                task();
            }
        }
        this.scheduledTaskMap.delete(this.currentTick);

        while(immediateTaskQueue.length > 0) {
            let fcn = immediateTaskQueue.shift();
            fcn();
        }
    }

    getTotalEntityCount() {
        return this.currentWorldEntityCount + this.currentInstanceEntityCount + this.currentInventoryEntityCount;
    }



    registerWorldEntity(number) {
        if(this.getTotalEntityCount() + number > this.MAX_ENTITY_COUNT) {
            // LOG/THROW SERVER ERROR?
            console.log("Too many entities (world)!");
        }

        this.currentWorldEntityCount += number;
    }

    registerInstanceEntity(number) {
        if(this.getTotalEntityCount() + number > this.MAX_ENTITY_COUNT) {
            // LOG/THROW SERVER ERROR?
            console.log("Too many entities (instance)!");
        }

        this.currentInstanceEntityCount += number;
    }

    registerInventoryEntity(number) {
        if(this.getTotalEntityCount() + number > this.MAX_ENTITY_COUNT) {
            // LOG/THROW SERVER ERROR?
            console.log("Too many entities (inventory)!");
        }

        this.currentInventoryEntityCount += number;
    }

    deregisterWorldEntity(number) {
        this.currentWorldEntityCount -= number;
    }

    deregisterInstanceEntity(number) {
        this.currentInstanceEntityCount -= number;
    }

    deregisterInventoryEntity(number) {
        this.currentInventoryEntityCount -= number;
    }





    initServerTick() {
        this.startServerTickThread();
    };

    startServerTickThread() {
        const shared = new Int32Array(new SharedArrayBuffer(4));
        this.doWork(shared);
    
        const worker = new Worker("./js/server/server_tick.js", {
            workerData: {
                shared: shared,
                interval: 1000000000 / this.TICK_RATE
            }
        });
        worker.on("error", (err) => {
            console.error(err);
            console.error(err.stack);
        });
    }

    async doWork(shared) {
        await Atomics.waitAsync(shared, 0, 0).value;
    
        // Only perform refresh tasks every second.
        if(this.currentTick % this.TICK_RATE === 0) {
            //console.log("REFRESH!");
            this.processRefreshTasks();
        }
    
        // Perform regular tasks every tick.
        this.processTasks();
    
        this.currentTick++;
    
        this.doWork(shared)
    }
}

module.exports = Server;