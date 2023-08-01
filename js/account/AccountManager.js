const Account = require("./Account.js");
const Character = require("./Character.js");
const Entity = require("../entity/Entity.js");

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

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serializeArray("accounts", this.accounts)
        .endObject();
    }

    static deserialize(reader) {
        let accountManager;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            accountManager = new AccountManager();

            let accounts = reader.deserializeArray("accounts", "Account");
            for(let account of accounts) {
                accountManager.addAccount(account);
            }
        }
        else {
            throw("Unknown version number: " + version);
        }
        
        reader.endObject();
        return accountManager;
    }

    static createInitialAccountManager() {
        // Load players onto the given world.
        let player1Mage = Entity.createInstance("PlayerMage", 1);
        player1Mage.homeMapName = "city";
        player1Mage.homeScreenName = "field1";
        player1Mage.homeX = 0;
        player1Mage.homeY = 0;

        let player1Warrior = Entity.createInstance("PlayerWarrior", 1);
        player1Warrior.homeMapName = "city";
        player1Warrior.homeScreenName = "field1";
        player1Warrior.homeX = 0;
        player1Warrior.homeY = 0;

        let player2Mage = Entity.createInstance("PlayerMage", 1);
        player2Mage.homeMapName = "city";
        player2Mage.homeScreenName = "field1";
        player2Mage.homeX = 7;
        player2Mage.homeY = 0;

        let player2Warrior = Entity.createInstance("PlayerWarrior", 1);
        player2Warrior.homeMapName = "city";
        player2Warrior.homeScreenName = "field1";
        player2Warrior.homeX = 7;
        player2Warrior.homeY = 0;

        
        let account1 = new Account();
        account1.key = "smith-password123";
        account1.addCharacter("mage", new Character(player1Mage));
        account1.addCharacter("warrior", new Character(player1Warrior));

        let account2 = new Account();
        account2.key = "maria-secret";
        account2.addCharacter("mage", new Character(player2Mage));
        account2.addCharacter("warrior", new Character(player2Warrior));

        let accountManager = new AccountManager();
        accountManager.addAccount(account1);
        accountManager.addAccount(account2);

        return accountManager;
    }
}

module.exports = AccountManager;