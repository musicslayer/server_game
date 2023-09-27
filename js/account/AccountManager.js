const crypto = require("crypto");

const Account = require("./Account.js");
const Character = require("./Character.js");
const Entity = require("../entity/Entity.js");

class AccountManager {
    accounts = [];
    accountMap = new Map();

    addAccount(account) {
        this.accounts.push(account);
        this.accountMap.set(account.username, account);
    }

    removeAccount(account) {
        let index = this.accounts.indexOf(account);
        this.accounts.splice(index, 1);
        this.accountMap.delete(account.username);
    }

    getAccount(username) {
        return this.accountMap.get(username);
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
            throw(new Error("Unknown version number: " + version));
        }
        
        reader.endObject();
        return accountManager;
    }

    static createInitialAccountManager() {
        // Load some initial player accounts.
        let player1Mage = Entity.createInstance("PlayerMage", 1);
        let player1Warrior = Entity.createInstance("PlayerWarrior", 1);
        let player2Mage = Entity.createInstance("PlayerMage", 1);
        let player2Warrior = Entity.createInstance("PlayerWarrior", 1);
        
        let account1 = new Account("smith", createHash("smith", "password123"), "a@a.com");
        account1.addCharacter(new Character("mage", player1Mage));
        account1.addCharacter(new Character("warrior", player1Warrior));

        let account2 = new Account("maria", createHash("maria", "secret"), "b@b.com");
        account2.addCharacter(new Character("mage", player2Mage));
        account2.addCharacter(new Character("warrior", player2Warrior));

        let accountManager = new AccountManager();
        accountManager.addAccount(account1);
        accountManager.addAccount(account2);

        return accountManager;
    }
}

function createHash(username, password) {
    // Use both the username and the password to create the hash.
    let s = username + "-" + password;
    let hash = Buffer.from(crypto.createHash("sha512").update(Buffer.from(s, "utf-8")).digest());
    let hashArray = Array.from(new Uint8Array(hash));
    let hashString = hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
    return hashString;
}

module.exports = AccountManager;