const { Worker } = require("worker_threads");

const Performance = require("../server/Performance.js");

class ServerScheduler {
    scheduledTaskMap = new Map();
    currentTick = 0;
    isPaused = true;

    scheduleTask(animation, time, task) {
        animation?.scheduleAnimation(this);

        this.addTask(time, () => {
            task();
        });
    }

    addTask(time, task) {
        let tick = Math.floor(this.currentTick + time * Performance.TICK_RATE);
        let tasks = this.scheduledTaskMap.get(tick) ?? [];
        tasks.push(task);
        this.scheduledTaskMap.set(tick, tasks);
    }

    initServerTick() {
        // Start a timer thread that will alert the main thread after every tick.
        this.isPaused = false;

        const shared = new Int32Array(new SharedArrayBuffer(4));
        this.doWork(shared);
    
        const worker = new Worker("./js/server/server_tick.js", {
            workerData: {
                shared: shared,
                interval: 1000000000 / Performance.TICK_RATE // In nanoseconds
            }
        });
        worker.on("error", (err) => {
            console.error(err);
            console.error(err.stack);
        });
    };

    async doWork(shared) {
        await Atomics.waitAsync(shared, 0, 0).value;
        if(!this.isPaused) {
            let tasks = this.scheduledTaskMap.get(this.currentTick) ?? [];
            this.scheduledTaskMap.delete(this.currentTick);

            // Increment the current tick now so that new tasks added during a task won't be executed until the next tick.
            this.currentTick++;

            for(let task of tasks) {
                task();
            }
        }
    
        this.doWork(shared)
    }
}

module.exports = ServerScheduler;