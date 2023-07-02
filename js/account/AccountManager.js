const fs = require("fs");

const Account = require("./Account.js");
const EntityFactory = require("../entity/EntityFactory.js");

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

    load(accountFile) {
        // Change the account state to the state recorded in the file.
        let s = fs.readFileSync(accountFile, "ascii");

        this.accounts = [];
        this.accountMap = new Map();
        
        this.deserialize(s);
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






    static createInitialAccountManager() {
        // Load players onto the given world.
        let player1Mage = EntityFactory.createInstance("PlayerMage", 1);
        player1Mage.homeMapName = "city";
        player1Mage.homeScreenName = "field1";
        player1Mage.homeX = 0;
        player1Mage.homeY = 0;

        let player1Warrior = EntityFactory.createInstance("PlayerWarrior", 1);
        player1Warrior.homeMapName = "city";
        player1Warrior.homeScreenName = "field1";
        player1Warrior.homeX = 0;
        player1Warrior.homeY = 0;

        let player2Mage = EntityFactory.createInstance("PlayerMage", 1);
        player2Mage.homeMapName = "city";
        player2Mage.homeScreenName = "field1";
        player2Mage.homeX = 7;
        player2Mage.homeY = 0;

        let player2Warrior = EntityFactory.createInstance("PlayerWarrior", 1);
        player2Warrior.homeMapName = "city";
        player2Warrior.homeScreenName = "field1";
        player2Warrior.homeX = 7;
        player2Warrior.homeY = 0;


        
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