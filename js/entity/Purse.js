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

        this.owner.getWorld().register("gold", N);
    }

    removeFromPurse(goldAmount) {
        this.goldTotal -= goldAmount;
        this.owner.getWorld().deregister("gold", goldAmount);
    }
}

module.exports = Purse;