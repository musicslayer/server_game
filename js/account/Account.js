class Account {
    characterMap = new Map();

    addCharacter(name, player) {
        this.characterMap.set(name, player);
    }

    getCharacter(name) {
        return this.characterMap.get(name);
    }
}

module.exports = Account;