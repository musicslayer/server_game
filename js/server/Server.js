class Server {
    static TICK_RATE = 60; // times per second

    static preTaskQueue = [];
    static taskQueue = [];
    static postTaskQueue = [];

    static refreshQueue = [];

    static tickInterval = setInterval(() => { Server.processTasks(); Server.processRefresh(); }, 1 / (Server.TICK_RATE * 1000));

    static addTask(fcn) {
        Server.taskQueue.push(fcn);
    }

    static addRefresh(fcn) {
        Server.refreshQueue.push(fcn);
    }

    static processTasks() {
        // Store the queues here. Anything added at this point won't be executed until the next tick.
        //console.log("PRE=" + Server.preTaskQueue.length + "|TASK=" + Server.taskQueue.length + "|POST=" + Server.postTaskQueue.length);

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
        //console.log("REFRESH=" + Server.refreshQueue.length);

        for(let fcn of Server.refreshQueue) {
            fcn();
        }
    }
}

module.exports = Server;