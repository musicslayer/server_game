class Purse {
    maxGoldTotel = 100000;
    goldTotal = 0;
    isActive = true;

    owner;

    constructor(owner) {
        this.owner = owner;
    }

    turnOn() {
        this.isActive = true;
    }

    turnOff() {
        this.isActive = false;
    }

    addToPurse(gold) {
        let N = Math.min(gold.stackSize, this.maxGoldTotel - this.goldTotal);

        gold.stackSize -= N;
        this.goldTotal += N;
    }

    removeFromPurse(goldAmount) {
        this.goldTotal -= goldAmount;
    }
}

module.exports = Purse;