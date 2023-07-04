const { Worker } = require("worker_threads");

const Performance = require("../server/Performance.js");
const ServerTaskList = require("./ServerTaskList.js");

class ServerScheduler {
    scheduledTaskMap = new Map();
    currentTick = 0;
    worker;

    scheduleTask(animation, time, task) {
        animation?.scheduleAnimation(this);

        this.addTask(time, () => {
            task();
        });
    }

    scheduleTask2(animation, time, serverTask) {
        animation?.scheduleAnimation(this);

        this.addTask2(time, serverTask);
    }

    // TODO Implement?
    scheduleRefreshTask2(animation, time, serverTask) {
        animation?.scheduleAnimation(this);

        this.addTask2(time, serverTask);
    }

    addTask(time, task) {
        let tick = Math.floor(this.currentTick + time * Performance.TICK_RATE);
        let serverTaskList = this.scheduledTaskMap.get(tick) ?? new ServerTaskList();
        serverTaskList.addTask(task);
        this.scheduledTaskMap.set(tick, serverTaskList);
    }

    addTask2(time, serverTask) {
        let tick = Math.floor(this.currentTick + time * Performance.TICK_RATE);
        let serverTaskList = this.scheduledTaskMap.get(tick) ?? new ServerTaskList();
        serverTaskList.addTask2(serverTask);
        this.scheduledTaskMap.set(tick, serverTaskList);
    }

    initServerTick() {
        // Start a timer thread that will alert the main thread after every tick.
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

        let serverTaskList = this.scheduledTaskMap.get(this.currentTick) ?? new ServerTaskList();
        this.scheduledTaskMap.delete(this.currentTick);

        // Increment the current tick now so that new tasks added during a task won't be executed until the next tick.
        this.currentTick++;

        serverTaskList.execute();
    
        this.doWork(shared)
    }

    serialize(writer) {
        // Don't serialize the worker because the deserialized server will create a new one.
        writer.beginObject()
            .serializeMap("scheduledTaskMap", this.scheduledTaskMap)
            .serialize("currentTick", this.currentTick)
        .endObject();
    }

    static deserialize(reader) {
        let serverScheduler = new ServerScheduler();

        reader.beginObject();
        let scheduledTaskMap = reader.deserializeMap("scheduledTaskMap", "Number", "ServerTaskList");
        let currentTick = reader.deserialize("currentTick", "Number");
        reader.endObject();

        serverScheduler.scheduledTaskMap = scheduledTaskMap;
        serverScheduler.currentTick = currentTick;

        return serverScheduler;
    }
}

module.exports = ServerScheduler;