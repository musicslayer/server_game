const fs = require("fs");

const Account = require("./Account.js");

class AccountManager {
    accounts = [];
    accountMap = new Map();

    addAccount(account) {
        this.accounts.push(account);
        this.accountMap.set(account.key, account);
    }

    getAccount(key) {
        return this.accountMap.get(key);
    }

    save(accountFile) {
        // Save the account state to the file.
        let s = this.serialize();
        fs.writeFileSync(accountFile, s, "ascii");
    }

    load(accountFile, server) {
        // Change the account state to the state recorded in the file.
        let s = fs.readFileSync(accountFile, "ascii");
        this.deserialize(s, server);
    }

    serialize() {
        let s = "{";
        s += "\"accounts\":";
        s += "[";
        for(let account of this.accounts) {
            s += account.serialize();
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += "}";

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);

        this.key = j.key;
        
        for(let account_j of j.accounts) {
            let account_s = JSON.stringify(account_j);

            let account = new Account();

            account.deserialize(account_s);
            this.addAccount(account);
        }
    }






    static createInitialAccountManager(world) {
        // Load players onto the given world.
        let player1Mage = world.createInstance("player_mage", 1);
        player1Mage.homeMapName = "city";
        player1Mage.homeScreenName = "field1";
        player1Mage.homeX = 0;
        player1Mage.homeY = 0;
        player1Mage.mapName = "city";
        player1Mage.screenName = "field1";
        player1Mage.x = player1Mage.homeX;
        player1Mage.y = player1Mage.homeY;

        let player1Warrior = world.createInstance("player_warrior", 1);
        player1Warrior.homeMapName = "city";
        player1Warrior.homeScreenName = "field1";
        player1Warrior.homeX = 0;
        player1Warrior.homeY = 0;
        player1Warrior.mapName = "city";
        player1Warrior.screenName = "field1";
        player1Warrior.x = player1Warrior.homeX;
        player1Warrior.y = player1Warrior.homeY;

        let player2Mage = world.createInstance("player_mage", 1);
        player2Mage.homeMapName = "city";
        player2Mage.homeScreenName = "field1";
        player2Mage.homeX = 7;
        player2Mage.homeY = 0;
        player2Mage.mapName = "city";
        player2Mage.screenName = "field1";
        player2Mage.x = player2Mage.homeX;
        player2Mage.y = player2Mage.homeY;

        let player2Warrior = world.createInstance("player_warrior", 1);
        player2Warrior.homeMapName = "city";
        player2Warrior.homeScreenName = "field1";
        player2Warrior.homeX = 7;
        player2Warrior.homeY = 0;
        player2Warrior.mapName = "city";
        player2Warrior.screenName = "field1";
        player2Warrior.x = player2Warrior.homeX;
        player2Warrior.y = player2Warrior.homeY;


        
        let account1 = new Account();
        account1.key = "smith-password123";
        account1.addCharacter("mage", player1Mage);
        account1.addCharacter("warrior", player1Warrior);

        let account2 = new Account();
        account2.key = "maria-secret";
        account2.addCharacter("mage", player2Mage);
        account2.addCharacter("warrior", player2Warrior);



        let accountManager = new AccountManager();
        accountManager.addAccount(account1);
        accountManager.addAccount(account2);

        return accountManager;
    }
}

module.exports = AccountManager;