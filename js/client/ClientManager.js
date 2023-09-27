class ClientManager {
    clients = [];

    addClient(client) {
        this.clients.push(client);
    }

    getClient(username, characterName) {
        for(let client of clients) {
            if(client.username === username && client.characterName === characterName) {
                return client;
            }
        }
        return undefined;
    }

    removeClient(client) {
        let index = this.clients.indexOf(client);
        this.clients.splice(index, 1);
    }

    static createInitialClientManager() {
        // Initially there are no clients because no players are logged in.
        return new ClientManager();
    }
}

module.exports = ClientManager;