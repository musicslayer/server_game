class Server {
    // TODO All state changes must be done through this class. We need to enforce this somehow.
    static TICK_RATE = 60; // times per second

    static preTaskQueue = [];
    static taskQueue = [];
    static postTaskQueue = [];

    static refreshQueue = [];

    static currentTick = 0;
    static scheduledTaskMap = new Map(); // tickNumber => task

    static tickInterval = setInterval(() => {
        Server.processTasks();
        Server.processRefresh();
        Server.currentTick++;
    }, 1 / (Server.TICK_RATE * 1000));

    static addTask(fcn) {
        Server.taskQueue.push(fcn);
    }

    static addRefresh(fcn) {
        Server.refreshQueue.push(fcn);
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

    static processTasks() {
        // Store the queues here. Anything added at this point won't be executed until the next tick.
        let preTaskQueue = Server.preTaskQueue;
        Server.preTaskQueue = [];

        let taskQueue = Server.taskQueue;
        Server.taskQueue = [];

        let postTaskQueue = Server.postTaskQueue;
        Server.postTaskQueue = [];

        while(preTaskQueue.length > 0) {
            let fcn = preTaskQueue.shift();
            fcn();
        }

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

        while(postTaskQueue.length > 0) {
            let fcn = postTaskQueue.shift();
            fcn();
        }
    }

    static processRefresh() {
        // Refresh tasks are recurring, so do not empty the array.
        for(let fcn of Server.refreshQueue) {
            fcn();
        }
    }
}

module.exports = Server;