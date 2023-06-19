//const NanoTimer = require("../util/NanoTimerZ.js");
const { Worker } = require("worker_threads");

class Server {
    // These variables affect server performance.
    static TICK_RATE = 60; // times per second
    static ANIMATION_FRAMES = 60; // frames per 1 tile of movement
    static MAX_ENTITY_COUNT = 100000000;
    static LOOT_TIME = 300; // (5 minutes) seconds that spawned loot will remain in the world before despawning

    static refreshQueue = []; // Tasks that occur every second (not every tick).
    static taskQueue = [];

    static scheduledTaskMap = new Map(); 

    static currentWorldEntityCount = 0;
    static currentInstanceEntityCount = 0; // Includes dynamic screens (void, death) and regular instances (dungeons).
    static currentInventoryEntityCount = 0;

    static currentTick = 0;

    static I = Server.init();

    /*
    static tickInterval = new NanoTimer().setInterval(() => {
        if(Server.currentTick % Server.TICK_RATE === 0) {
            Server.processRefresh();
        }
        Server.processTasks();
        Server.currentTick++;

    //}, "16.666666666m");
    }, "100m");
    */

    /*
    static date1 = Date.now();
    static tickInterval = new NanoTimer().setInterval(() => {
        //console.log(Date.now() - Server.date1);
        let date2 = Date.now();

        if(Server.currentTick % Server.TICK_RATE === 0) {
            Server.processRefresh();
        }
        Server.processTasks();
        Server.currentTick++;

        let date3 = Date.now();

        console.log(Server.currentTick + ": " + (date2 - Server.date1) + ": " + (date3 - date2));
        Server.date1 = date2;

    //}, "16.666666666m");
    }, "100m");
    */

    /*
    static date1 = Date.now();
    static tickInterval = new NanoTimer().setInterval(() => {
        let date2 = Date.now();

        console.log(Server.currentTick + ": " + (date2 - Server.date1));
        Server.date1 = date2;

        if(Server.currentTick % Server.TICK_RATE === 0) {
            Server.processRefresh();
        }
        Server.processTasks();
        Server.currentTick++;

    }, "16.666666666m");
    */

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

    static getTotalEntityCount() {
        return Server.currentWorldEntityCount + Server.currentInstanceEntityCount + Server.currentInventoryEntityCount;
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

    static init() {
        workerFunc();
    };
}

async function workerFunc() {
    return new Promise(async (resolve, reject) => {
        let T = process.hrtime();

        const worker = new Worker("./worker_task.js", {
            workerData: {
                //interval: 16666666,
                interval: 33333333,
            }
        });
        worker.on("message", () => {
            let hrtimeDeltaArray = process.hrtime(T);
            hrtimeDelta = (hrtimeDeltaArray[0] * 1000000000) + hrtimeDeltaArray[1];

            //if(hrtimeDelta > 18000000) {
            if(hrtimeDelta > 35000000) {
                console.log(hrtimeDelta);
            }

            T = process.hrtime();
            
            if(Server.currentTick % Server.TICK_RATE === 0) {
                Server.processRefresh();
            }
            Server.processTasks();
            Server.currentTick++;
            
        })
        worker.on("exit", () => {
            resolve();
        });
        worker.on("error", (err) => {
            console.error(err);
            console.error(err.stack);
            resolve();
        });
    });
}

module.exports = Server;