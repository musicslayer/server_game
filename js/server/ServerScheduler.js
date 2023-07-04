const { Worker } = require("worker_threads");

const Performance = require("../server/Performance.js");

class ServerScheduler {
    scheduledTaskMap = new Map();
    currentTick = 0;
    isPaused = true;
    worker;

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
    
        this.worker = new Worker("./js/server/server_tick.js", {
            workerData: {
                shared: shared,
                interval: 1000000000 / Performance.TICK_RATE // In nanoseconds
            }
        });
        this.worker.on("error", (err) => {
            console.error(err);
            console.error(err.stack);
        });
    };

    async endServerTick() {
        // This is needed to make sure we can end worker threads when a server is no longer in use.
        this.worker.terminate();
        this.worker = undefined;
    }

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

    serialize(writer) {
        // Don't serialize isPaused because we want deserialized servers to always start out paused.
        // Don't serialize worker because the deserialized server will create a new worker.
        writer.beginObject()
            .serialize("scheduledTaskMap", this.scheduledTaskMap)
            .serialize("currentTick", this.currentTick)
        .endObject();
    }

    static deserialize(reader) {
        let serverScheduler = new ServerScheduler();

        reader.beginObject();
        // TODO How do we deserialize a map with values that are arrays?
        let scheduledTaskMap = reader.deserializeMap("scheduledTaskMap", "Number", "Function");
        let currentTick = reader.deserialize("currentTick", "Number");
        reader.endObject();

        serverScheduler.scheduledTaskMap = scheduledTaskMap;
        serverScheduler.currentTick = currentTick;

        return serverScheduler;
    }
}

module.exports = ServerScheduler;