class ClientManager {
    clients = [];
    clientMap = new Map();

    addClient(client) {
        this.clients.push(client);
        this.clientMap.set(client.key, client);
    }

    getClient(key) {
        return this.clientMap.get(key);
    }

    removeClient(client) {
        const index = this.clients.indexOf(client);
        if(index > -1) {
            this.clients.splice(index, 1);
        }

        this.clientMap.delete(client.key);
    }

    static createInitialClientManager() {
        // Initially there are no clients because no players are logged in.
        return new ClientManager();
    }
}

module.exports = ClientManager;