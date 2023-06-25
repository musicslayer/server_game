const { Worker } = require("worker_threads");

class Server {
    // These variables affect server performance.
    TICK_RATE = 60; // times per second
    MOVEMENT_FRAMES = 60; // frames per 1 tile of movement
    LOOT_TIME = 300; // (5 minutes) seconds that spawned loot will remain in the world before despawning

    scheduledTaskMap = new Map(); 
    currentTick = 0;

    addTask(seconds, task) {
        let tick = Math.floor(this.currentTick + seconds * this.TICK_RATE);
        let tasks = this.scheduledTaskMap.get(tick) ?? [];
        tasks.push(task);
        this.scheduledTaskMap.set(tick, tasks);
    }

    addRefreshTask(seconds, task) {
        // Add a task that will execute every time the given duration passes.
        this.addTask(seconds, () => {
            task();
            this.addRefreshTask(seconds, task);
        });
    }

    initServerTick() {
        // Start a timer thread that will alert the main thread after every tick.
        const shared = new Int32Array(new SharedArrayBuffer(4));
        this.doWork(shared);
    
        const worker = new Worker("./js/server/server_tick.js", {
            workerData: {
                shared: shared,
                interval: 1000000000 / this.TICK_RATE // In nanoseconds
            }
        });
        worker.on("error", (err) => {
            console.error(err);
            console.error(err.stack);
        });
    };

    async doWork(shared) {
        await Atomics.waitAsync(shared, 0, 0).value;

        let tasks = this.scheduledTaskMap.get(this.currentTick) ?? [];
        this.scheduledTaskMap.delete(this.currentTick);

        // Increment the current tick now so that new tasks added during a task won't be executed until the next tick.
        this.currentTick++;

        for(let task of tasks) {
            task();
        }
    
        this.doWork(shared)
    }
}

module.exports = Server;