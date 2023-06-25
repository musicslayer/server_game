const Account = require("./Account.js");

class AccountManager {
    accountMap = new Map();

    createNewAccount(key) {
        this.accountMap.set(key, new Account());
    }

    getAccount(key) {
        return this.accountMap.get(key);
    }

    static createInitialAccountManager(galaxy) {
        // Load player information
        let player1Mage = galaxy.worlds[0].createInstance("player_mage", 1);
        player1Mage.homeMapName = "city";
        player1Mage.homeScreenName = "field1";
        player1Mage.homeX = 0;
        player1Mage.homeY = 0;
        player1Mage.screen = galaxy.worlds[0].getMapByName(player1Mage.homeMapName).getScreenByName(player1Mage.homeScreenName);
        player1Mage.x = player1Mage.homeX;
        player1Mage.y = player1Mage.homeY;

        let player1Warrior = galaxy.worlds[0].createInstance("player_warrior", 1);
        player1Warrior.homeMapName = "city";
        player1Warrior.homeScreenName = "field1";
        player1Warrior.homeX = 0;
        player1Warrior.homeY = 0;
        player1Warrior.screen = galaxy.worlds[0].getMapByName(player1Warrior.homeMapName).getScreenByName(player1Warrior.homeScreenName);
        player1Warrior.x = player1Warrior.homeX;
        player1Warrior.y = player1Warrior.homeY;

        let player2Mage = galaxy.worlds[0].createInstance("player_mage", 1);
        player2Mage.homeMapName = "city";
        player2Mage.homeScreenName = "field1";
        player2Mage.homeX = 7;
        player2Mage.homeY = 0;
        player2Mage.screen = galaxy.worlds[0].getMapByName(player2Mage.homeMapName).getScreenByName(player2Mage.homeScreenName);
        player2Mage.x = player2Mage.homeX;
        player2Mage.y = player2Mage.homeY;

        let player2Warrior = galaxy.worlds[0].createInstance("player_warrior", 1);
        player2Warrior.homeMapName = "city";
        player2Warrior.homeScreenName = "field1";
        player2Warrior.homeX = 7;
        player2Warrior.homeY = 0;
        player2Warrior.screen = galaxy.worlds[0].getMapByName(player2Warrior.homeMapName).getScreenByName(player2Warrior.homeScreenName);
        player2Warrior.x = player2Warrior.homeX;
        player2Warrior.y = player2Warrior.homeY;

        let accountManager = new AccountManager();
        accountManager.createNewAccount("smith-password123");
        accountManager.createNewAccount("maria-secret");

        let account1 = accountManager.getAccount("smith-password123");
        let account2 = accountManager.getAccount("maria-secret");

        account1.addCharacter("mage", player1Mage);
        account1.addCharacter("warrior", player1Warrior);
        account2.addCharacter("mage", player2Mage);
        account2.addCharacter("warrior", player2Warrior);

        return accountManager;
    }
}

module.exports = AccountManager;