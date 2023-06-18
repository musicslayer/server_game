class Server {
    // TODO All state changes must be done through this class. We need to enforce this somehow.

    // These variables affect server performance.
    static TICK_RATE = 60; // times per second
    static ANIMATION_FRAMES = 60; // frames per 1 tile of movement
    static MAX_ENTITY_COUNT = 100000000;

    static refreshQueue = []; // Tasks that occur every second (not every tick).
    static taskQueue = [];

    static scheduledTaskMap = new Map(); 

    static currentWorldEntityCount = 0;
    static currentInstanceEntityCount = 0; // Includes dynamic screens (void, death) and regular instances (dungeons).
    static currentInventoryEntityCount = 0;

    static currentTick = 0;

    static tickInterval = setInterval(() => {
        if(Server.currentTick % Server.TICK_RATE === 0) {
            Server.processRefresh();
        }

        Server.processTasks();
        Server.currentTick++;
    }, 1000 / Server.TICK_RATE);

    static addRefresh(fcn) {
        Server.refreshQueue.push(fcn);
    }

    static addTask(fcn) {
        Server.taskQueue.push(fcn);
    }



    static scheduleTaskForSeconds(seconds, fcn) {
        let tick = Server.currentTick + seconds * Server.TICK_RATE;
        let tasks = Server.scheduledTaskMap.get(tick);
        if(tasks === undefined) {
            tasks = [];
        }
        tasks.push(fcn);
        Server.scheduledTaskMap.set(tick, tasks);
    }

    static processRefresh() {
        // Refresh tasks are recurring, so do not empty the array.
        for(let fcn of Server.refreshQueue) {
            fcn();
        }
    }

    static processTasks() {
        // Store the queue here. Anything added at this point won't be executed until the next tick.
        let taskQueue = Server.taskQueue;
        Server.taskQueue = [];

        let tasks = Server.scheduledTaskMap.get(Server.currentTick);
        if(tasks !== undefined) {
            for(let task of tasks) {
                task();
            }
        }
        Server.scheduledTaskMap.delete(Server.currentTick);

        while(taskQueue.length > 0) {
            let fcn = taskQueue.shift();
            fcn();
        }
    }

    static registerWorldEntity(number) {
        if(Server.getTotalEntityCount() + number > Server.MAX_ENTITY_COUNT) {
            // LOG/THROW SERVER ERROR?
            console.log("Too many entities (world)!");
        }

        Server.currentWorldEntityCount += number;
    }

    static registerInstanceEntity(number) {
        if(Server.getTotalEntityCount() + number > Server.MAX_ENTITY_COUNT) {
            // LOG/THROW SERVER ERROR?
            console.log("Too many entities (instance)!");
        }

        Server.currentInstanceEntityCount += number;
    }

    static registerInventoryEntity(number) {
        if(Server.getTotalEntityCount() + number > Server.MAX_ENTITY_COUNT) {
            // LOG/THROW SERVER ERROR?
            console.log("Too many entities (inventory)!");
        }

        Server.currentInventoryEntityCount += number;
    }

    static deregisterWorldEntity(number) {
        Server.currentWorldEntityCount -= number;
    }

    static deregisterInstanceEntity(number) {
        Server.currentInstanceEntityCount -= number;
    }

    static deregisterInventoryEntity(number) {
        Server.currentInventoryEntityCount -= number;
    }

    static getTotalEntityCount() {
        return Server.currentWorldEntityCount + Server.currentInstanceEntityCount + Server.currentInventoryEntityCount;
    }
}

module.exports = Server;