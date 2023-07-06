const Client = require("./Client.js");

class ClientFactory {
    static id = 0;
    static clientIDMap = new Map();
    static clientKeyMap = new Map();

    static createInstance(serverName, worldName, playerName, player, key) {
        let id = ClientFactory.id++;

        let client = new Client(serverName, worldName, playerName, player);
        client.id = id;
        client.key = key;

        ClientFactory.clientIDMap.set(id, client);
        ClientFactory.clientKeyMap.set(key, client);

        return client;
    }
}

module.exports = ClientFactory;