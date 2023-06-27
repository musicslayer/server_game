class Purse {
    maxGoldTotel = 100000;
    goldTotal = 0;

    owner;

    constructor(owner) {
        this.owner = owner;
    }

    addToPurse(gold) {
        let N = Math.min(gold.stackSize, this.maxGoldTotel - this.goldTotal);

        gold.stackSize -= N;
        this.goldTotal += N;

        this.owner.getWorldCounter().register("gold", N);
    }

    removeFromPurse(goldAmount) {
        this.goldTotal -= goldAmount;
        this.owner.getWorldCounter().deregister("gold", goldAmount);
    }
}

module.exports = Purse;